# 필요한 라이브러리 및 모듈 임포트
import os
import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from langchain.schema import StrOutputParser
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.tools import tool
from typing import List
from dotenv import load_dotenv
from .models import Dialog
from django.db import transaction
from langchain.schema import HumanMessage, AIMessage


# 환경 변수 로드 (.env 파일에서 설정값을 가져옴)
load_dotenv()

# OpenAI API 키 설정
openai_api_key = os.environ["OPENAI_API_KEY"]


# 상담 프롬프트 정의
child_role = '''
{역할:
유년기 시기에 대하여 상대가 이야기 하도록 유도한다.
해당시기의 주요 사건, 의미 있는 관계, 감정 등을 탐색한다.
한 주제를 너무 깊게 파고들지 말고, 적절하게 다른 주제로 넘어간다. 
사용자의 정서 상태를 확인하고 그에 맞는 상담 반응을 제공한다.
질문은 구체적으로 해서 상대가 답변하기 편하도록 한다.

질문예시:
1. 어르신께서 기억하시는 가장 오래된 어린시절 기억은 무엇인가요?
2. 가족에 대해 이야기해주세요. 부모님은 어떤 분이셨나요?
3. 어린 시절을 떠올리면 어떤 느낌이 드나요? 어린 아이로서의 생활은 어떠셨나요?
4. 어린 시절 친구들에 대해 말해주세요. 제일 친한 친구는 누구였나요?
5. 어린시절 특별히 기억나는 사건이 있나요?

상담기술:
재진술, 구체화, 명료화, 감정 명명, 감정 반영, 타당화를 사용한다. }
'''


# 상담 프롬프트 정의
adult_role = '''
{역할:
청년기 시기에 대하여 상대가 이야기 하도록 유도한다.
해당시기의 주요 사건, 의미 있는 관계, 감정 등을 탐색한다.
한 주제를 너무 깊게 파고들지 말고, 적절하게 다른 주제로 넘어간다. 
사용자의 정서 상태를 확인하고 그에 맞는 상담 반응을 제공한다.
질문은 구체적으로 해서 상대가 답변하기 편하도록 한다.

질문예시:
1. 성인으로서 어르신께서는 하고자 계획했던 일들을 하셨나요?
2. 청년 시기에 하셨던 일이나 직장에 대해 이야기 해주세요.
3. 어르신께서는 결정하신 선택들에 만족하셨나요?
4. 청년 시기에 결혼하셨다면 결혼에 대해 이야기해주세요. 행복한 결혼생활을 하셨나요?
5. 청년 시기에 어떤 중요한 결정들을 하셨나요?

상담기술:
재진술, 구체화, 명료화, 감정 명명, 감정 반영, 타당화를 사용한다. }
'''

# 상담 프롬프트 정의
middle_role = '''
{역할:
중년기 시기에 대하여 상대가 이야기 하도록 유도한다.
해당시기의 주요 사건, 의미 있는 관계, 감정 등을 탐색한다.
한 주제를 너무 깊게 파고들지 말고, 적절하게 다른 주제로 넘어간다. 
사용자의 정서 상태를 확인하고 그에 맞는 상담 반응을 제공한다.
질문은 구체적으로 해서 상대가 답변하기 편하도록 한다.

질문예시:
1. 어르신께서는 지금까지 살아오시면서 어떤 관계가 가장 중요하다고 생각하시나요?
2. 자녀분들에 대해 이야기해주세요. 부모로써 즐거우셨나요? 자녀분들에게 도움이 된 것이 있다면 어떤것들인가요?
3. 가깝게 지내시는 친구들에 대해 이야기해주세요.

상담기술:
재진술, 구체화, 명료화, 감정 명명, 감정 반영, 타당화를 사용한다. }
'''

# 상담 프롬프트 정의
elderly_role = '''
{역할:
노년기 시기에 대하여 상대가 이야기 하도록 유도한다.
해당시기의 주요 사건, 의미 있는 관계, 감정 등을 탐색한다.
한 주제를 너무 깊게 파고들지 말고, 적절하게 다른 주제로 넘어간다. 
사용자의 정서 상태를 확인하고 그에 맞는 상담 반응을 제공한다.
질문은 구체적으로 해서 상대가 답변하기 편하도록 한다.

질문예시:
1. 요즘 취미 생활이나 관심사에 대해 이야기해주세요.
2. 지금 가장 좋은 것이 무엇인지요? 반면 지금 가장 나쁜 것이 무엇인지요?
3. 최근 겪었던 힘든 일이 있을까요?

상담기술:
재진술, 구체화, 명료화, 감정 명명, 감정 반영, 타당화를 사용한다. }
'''

# 에이전트 프롬프트 템플릿 설정
# 상담사의 역할과 행동 지침을 정의

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "너는 노인 대상 생애 회고 치료(Life Review Therapy)를 전문으로 하는 심리상담사고 이름은 '봄이'야. "
            "너 자신이 상대 어르신의 손녀라고 생각하고, 친근하게 대화해줘. "
            "질문을 할 때는 한번에 하나씩만 해야해. "
            "노인분과 대화를 나눌건데, 대화를 나누면서 고려해야 할 사항들이 있어. "
            "가장 첫 질문은 인사와 안부를 묻고, 인사와 안부에 대한 대화가 있었으면 다음으로 넘어가줘 "
            "다음 대화의 역할은 다음과 같아 : {role}"
            "어르신의 성별은 알 수 없으니, 할머니 혹은 할아버지 어떤 것도 절대 표현하지마. "
            
        ),
        MessagesPlaceholder(variable_name="chat_history"),
        ("user", "<input>{input}</input> "
        " '#### 대화 종료 ####'라고 하면 대화를 마무리해줘. 너는 대화종료라는 말은 하지마. 대화 마무리 멘트 예시: "
        "다음에 또 다른 이야기 들려주세요. 오늘도 소중한 이야기 들려주셔서 감사해요."
        ),
    ]
)

# LLM(Language Model) 초기화
# GPT-4를 사용하며, temperature를 0.2로 설정하여 일관된 응답 유도
llm = ChatOpenAI(model='gpt-4o-mini', temperature=0.2)
chain = prompt | llm | StrOutputParser()
# 세션 저장소 초기화
store = {}

# 세션별 대화 기록 관리 함수
def get_session_history(session_id: str):
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

# 대화 기록이 포함된 체인 생성
chain_with_history = RunnableWithMessageHistory(
        chain,
        get_session_history,
        input_messages_key="input",
        history_messages_key="chat_history"
    )

# 메인 페이지 렌더링
def index(request):
    request.session['count'] = 0  # 세션에 count 저장

from django.db import connection
from .models import Dialog

@csrf_exempt
def index(request):
    # 모든 데이터 삭제
    request.session['count'] = 0  # 세션에 count 저장
    Dialog.objects.all().delete()
    
    # Auto-increment 초기화
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='dialog';")




# store에서 대화 기록 가져오기
def get_dialogues_from_store(session_id):
    if session_id in store:
        # store[session_id]가 ChatMessageHistory 객체라 가정하고 messages를 가져옴
        return store[session_id].messages
    else:
        # 세션 ID가 없으면 빈 리스트 반환
        return []


@csrf_exempt
def save_dialogues(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST 요청만 허용됩니다.'}, status=405)

    # 세션 ID 가져오기 (기본값 'default_session')
    session_id = request.session.get('session_id', 'default_session')

    # store에서 대화 기록 가져오기
    dialogues = get_dialogues_from_store(session_id)
    if not dialogues:
        return JsonResponse({'message': '저장할 대화가 없습니다.'}, status=400)

    try:
        with transaction.atomic():
            # DB에 대화 기록 저장
            for dialogue in dialogues:
                # HumanMessage와 AIMessage에 따라 message_type 설정
                message_type = 'human' if isinstance(dialogue, HumanMessage) else 'ai'

                Dialog.objects.create(
                    session_id=session_id,
                    content=dialogue.content,  # 메시지 내용 저장
                    message_type=message_type  # 메시지 유형 저장
                )
        
        return JsonResponse({'message': '대화가 성공적으로 저장되었습니다.'})
    except Exception as e:
        return JsonResponse({'error': f'저장 중 오류 발생: {str(e)}'}, status=500)



# 음성 처리 및 응답 생성 뷰
@csrf_exempt
def process_speech(request):
    if request.method == 'POST':
        user_text = ''
        # JSON 요청 처리
        if request.content_type == 'application/json':
            try:
                data = json.loads(request.body)
                user_text = data.get('text', '')
                session_id = data.get('session_id', 'default_session')
                role_num = data.get('step', 3)

            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON'}, status=400)
        # 폼 데이터 요청 처리
        else:
            user_text = request.POST.get('text', '')
            session_id = request.POST.get('session_id', 'default_session')

        # 텍스트가 비어있는 경우 처리
        if not user_text:
            return JsonResponse({'error': 'No text provided'}, status=400)
        
        role_dict = {
            0: child_role,
            1: adult_role,
            2: middle_role,
            3: elderly_role,
        }
        
        selected_role = role_dict.get(role_num, adult_role)

        try:
            # 세션에서 count 가져오기 (초기값은 0)
            count = request.session.get('count', 0)

            if count > 5:
                user_text = "#### 대화 종료 ####"
                count = 0

            # 세션 설정
            config = {"configurable": {"session_id": session_id}}

            result = chain_with_history.invoke({
                "input": user_text,
                "role": selected_role
            }, config=config)

            # 결과에서 응답 추출
            response = result
            count += 1
            request.session['count'] = count  # 세션에 count 업데이트
            print(store)
            print(selected_role)
            if role_num==3:
                return JsonResponse({'response': response, 'step' : 4})
            return JsonResponse({'response': response})

        except Exception as e:
            return JsonResponse({'error': f'An error occurred: {str(e)}'}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=400)
