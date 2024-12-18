# 필요한 라이브러리 및 모듈 임포트
import os
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from langchain.schema import StrOutputParser
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from dotenv import load_dotenv
from typing import List

# 환경 변수 로드 (.env 파일에서 설정값을 가져옴)
load_dotenv()

# OpenAI API 키 설정
openai_api_key = os.environ["OPENAI_API_KEY"]

# 상담 프롬프트 정의
middle_life_history = '''
{역할:
 청년기 시기에 대하여 상대가 이야기 하도록 유도한다.
 하고싶었던 일이나 생활들에 대해서 구체적인 질문을 한다.
해당시기의 주요 사건, 의미 있는 관계, 감정 등을 탐색한다.
힘들었던 순간, 재밌었던 순간 등 다양한 기억에 대해서 대화를 나눈다.
한 주제를 너무 깊게 파고들지 말고, 적절하게 다른 주제로 넘어간다. 
사용자의 정서 상태를 확인하고 그에 맞는 상담 반응을 제공한다.
질문은 구체적으로 해서 상대가 답변하기 편하도록 한다.
상담기술:
재진술, 구체화, 명료화, 감정 명명, 감정 반영, 타당화를 사용한다. }
'''

# 에이전트 프롬프트 템플릿 설정
prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "너는 노인 대상 생애 회고 치료(Life Review Therapy)를 전문으로 하는 심리상담사고 이름은 '봄이'야. "
            "너 자신이 상대 어르신의 손녀라고 생각하고, 친근하게 대화해줘. "
            "질문을 할 때는 한번에 하나씩만 해야해. "
            "노인분과 대화를 나누면서 고려해야 할 사항들이 있어. "
            "가장 첫 질문은 인사와 안부를 묻고, 인사와 안부에 대한 대화가 있었으면 다음으로 넘어가줘 "
            "다음 대화의 역할은 다음과 같아 : {middle_life_history}"
            "어르신의 성별은 알 수 없으니, 할머니 혹은 할아버지 어떤 것도 절대 표현하지마. "
        ),
        MessagesPlaceholder(variable_name="chat_history"),
        ("user", "<input>{input}</input> "
         " '#### 대화 종료 ####'라고 하면 대화를 마무리해줘. 너는 대화종료라는 말은 하지마. 대화 마무리 멘트 예시: "
         "오늘 청년 시절 이야기 잘 들었어요. 다음에 또 다른 이야기 들려주세요."
         "오늘도 소중한 이야기 들려주셔서 감사해요."
         ),
    ]
)

# LLM(Language Model) 초기화
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

# WebSocket Consumer 정의
class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.session_id = self.scope['session'].session_key or 'default_session'
        self.count = self.scope['session'].get('count', 0)

    async def disconnect(self, close_code):
        await self.close()

    async def receive(self, text_data):
        data = json.loads(text_data)
        user_text = data.get('text', '')

        if not user_text:
            await self.send(text_data=json.dumps({'error': 'No text provided'}))
            return

        try:
            # 세션의 count 확인 및 종료 조건 설정
            if self.count > 5:
                user_text = "#### 대화 종료 ####"
                self.count = 0

            # 세션 설정 및 대화 호출
            config = {"configurable": {"session_id": self.session_id}}
            result = chain_with_history.invoke({
                "input": user_text,
                "middle_life_history": middle_life_history
            }, config=config)

            # 결과 전송
            response = result
            self.count += 1
            self.scope['session']['count'] = self.count  # 세션에 count 업데이트
            await self.send(text_data=json.dumps({'response': response}))

        except Exception as e:
            await self.send(text_data=json.dumps({'error': f'An error occurred: {str(e)}'}))
