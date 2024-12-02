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
from langchain import hub
from langchain.agents import AgentExecutor, create_react_agent
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_openai import OpenAI
from langchain.agents import initialize_agent, Tool, AgentExecutor

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

tools = [
        Tool(
            name="search_tool",
            func=lambda x: f"검색 결과 없음: {x}",
            description="사용자의 질문에 검색 결과 제공"
        )
    ]

tool_names=[tool.name for tool in tools]

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "다음 질문에 최선을 다해 답변하세요. 아래의 지침을 따라야 합니다:\n\n"
                "### 형식:\n"
                "1. **생각 (Thought):** 현재 상황에 대한 설명을 작성합니다.\n"
                "2. **행동 (Action):** 수행할 작업을 작성합니다. 행동은 도구를 사용하거나 `Final Answer`로 직접 사용자에게 답변을 반환할 수 있습니다.\n"
                "3. **행동 입력 (Action Input):** 행동에 필요한 입력값을 작성합니다.\n"
                "4. **관찰 (Observation):** 행동의 결과를 기록합니다.\n"
                "5. **최종 답변 (Final Answer):** 관찰을 통해 얻은 가장 적절한 답변으로 대화를 종료합니다.\n\n"
                "행동 입력으로 **가장 적절한 답변**이 생성되었다면, 반드시 `Final Answer`로 대답을 마무리하세요.\n\n"
                "---\n\n"
                "### 지침:\n"
                "- **역할:** 노인 대상 생애 회고 치료(Life Review Therapy)를 전문으로 하는 심리상담사입니다. 이름은 **'봄이'**이며, 손녀처럼 친근하게 대화합니다.\n"
                "- **대화 진행:**\n"
                "  1. 첫 질문은 인사와 안부를 묻습니다.\n"
                "  2. 인사 및 안부 대화가 끝난 후 다음 주제로 넘어갑니다.\n"
                "  3. 질문은 한 번에 하나씩만 해야 합니다.\n"
                "  4. 어르신의 성별은 알 수 없으므로, 특정 성별을 언급하지 않습니다.\n"
                "- **대화 종료:** '#### 대화 종료 ####'라는 요청이 들어오면 대화 종료 멘트를 사용합니다.\n"
                "  - 예: \"다음에 또 다른 이야기 들려주세요. 오늘도 소중한 이야기 들려주셔서 감사해요.\"\n\n"
                "---\n\n"
                "### 도구 사용 가능:\n"
                "{tool_names}\n\n"
                "---\n\n"
                "### 응답 예시:\n"
                "**질문:** {input}\n\n"
                "**Thought:** 현재 상황에 대해 분석합니다.\n"
                "**Action:** 도구를 사용하거나 직접 답변합니다.\n"
                "**Action Input:** 도구 입력값을 작성합니다.\n"
                "**Observation:** 도구 사용의 결과를 기록합니다.\n"
                "**Thought:** 답변 준비 완료.\n"
                "**Final Answer:** 최종 답변을 제공합니다.\n\n"
                "**시작하세요!**"
            ),
        ),
        MessagesPlaceholder(variable_name="chat_history"),
        (
            "user",
            (
                "<input>{input}</input>\n"
                "'#### 대화 종료 ####'라고 하면 대화를 마무리해줘. "
                "너는 대화종료라는 말은 하지마. 대화 마무리 멘트 예시: "
                "다음에 또 다른 이야기 들려주세요. 오늘도 소중한 이야기 들려주셔서 감사해요.\n"
                "현재 작업 메모: {agent_scratchpad}"
            ),
        ),
    ]
)




# LLM(Language Model) 초기화
# GPT-4를 사용하며, temperature를 0.2로 설정하여 일관된 응답 유도
llm = ChatOpenAI(model='gpt-4o-mini', temperature=0.2)
chain = prompt | llm | StrOutputParser()
# 세션 저장소 초기화

# 전체 대화를 저장하는 단일 저장소
store = {}

def get_session_history(session_id: str):
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

def create_simple_chain(role: str):
    # 단순화된 프롬프트 템플릿
    simple_prompt = ChatPromptTemplate.from_messages([
        ("system", 
         "당신은 노인 대상 생애 회고 치료를 전문으로 하는 '봄이'라는 상담사입니다. "
         "손녀처럼 친근하게 대화하며, 다음 역할을 수행하세요:\n\n"
         "{role}"
        ),
        MessagesPlaceholder(variable_name="chat_history"),
        ("user", "{input}")
    ])
    
    # 단순 체인 생성
    chain = simple_prompt | llm | StrOutputParser()
    return chain

# 역할 정의
roles = {
    "child": child_role,
    "adult": adult_role,
    "middle": middle_role,
    "elderly": elderly_role,
}

# 각 역할별 에이전트 생성 및 초기화
agents = {
    role_key: create_simple_chain(role_content)
    for role_key, role_content in roles.items()
}

def supervisor(session_id, user_text, step):
    if step >= len(roles):
        return {"response": "#### 대화 종료 ####", "step": step}
    
    role_key = list(roles.keys())[step]
    role_content = roles[role_key]
    
    try:
        chain = create_simple_chain(role_content)
        chat_history = get_dialogues_from_store(session_id)
        
        response = chain.invoke({
            "input": user_text,
            "chat_history": chat_history,
            "role": role_content
        })
        
        # 대화 기록 저장
        history = get_session_history(session_id)
        history.add_user_message(user_text)
        history.add_ai_message(response)
        
        return {
            "response": response,
            "step": step + 1
        }
        
    except Exception as e:
        print(f"Error in supervisor: {e}")
        return {
            "response": "죄송합니다. 다시 한 번 말씀해 주시겠어요?",
            "step": step
        }

def get_dialogues_from_store(session_id):
    if session_id in store:
        return store[session_id].messages
    return []

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
    
    return render(request, 'index.html')


# store에서 대화 기록 가져오기
def get_dialogues_from_store(session_id):
    if session_id in store:
        # store[session_id]가 ChatMessageHistory 객체라 가정하고 messages를 가져옴
        return store[session_id].messages
    else:
        # 세션 ID가 없으면 빈 리스트 반환
        return []

# 음성 처리 및 응답 생성 뷰
@csrf_exempt
def process_speech(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user_text = data.get('text', '')
        session_id = data.get('session_id', 'default_session')
        step = data.get('step', 0)

        response_data = supervisor(session_id, user_text, step)
        print(response_data,'마지막 응답')
        return JsonResponse({'text': response_data['response'], 'step': response_data['step']})

    return JsonResponse({'error': 'Invalid request method'}, status=400)