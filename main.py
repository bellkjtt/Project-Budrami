# 필요한 라이브러리 및 모듈 임포트
import os
import json
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from langchain.schema import StrOutputParser
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from dotenv import load_dotenv

# 환경 변수 로드 (.env 파일에서 설정값을 가져옴)
load_dotenv()

# OpenAI API 키 설정
openai_api_key = os.environ["OPENAI_API_KEY"]

# FastAPI 앱 인스턴스 생성
app = FastAPI()

# CORS 설정 (필요에 따라 설정)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 특정 출처만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
            "노인분과 대화를 나눌건데, 대화를 나누면서 고려해야 할 사항들이 있어. "
            "가장 첫 질문은 인사와 안부를 묻고, 인사와 안부에 대한 대화가 있었으면 다음으로 넘어가줘 "
            "다음 대화의 역할은 다음과 같아 : {middle_life_history} "
            "어르신의 성별은 알 수 없으니, 할머니 혹은 할아버지 어떤 것도 절대 표현하지마."
        ),
        MessagesPlaceholder(variable_name="chat_history"),
        ("user", "<input>{input}</input> "
        " '#### 대화 종료 ####'라고 하면 대화를 마무리해줘. 너는 대화종료라는 말은 하지마. 대화 마무리 멘트 예시: "
        "오늘 청년 시절 이야기 잘 들었어요. 다음에 또 다른 이야기 들려주세요."
        "오늘도 소중한 이야기 들려주셔서 감사해요."
        ),
    ]
)

# LLM 및 체인 초기화
llm = ChatOpenAI(model='gpt-4o-mini', temperature=0.2)
chain = prompt | llm | StrOutputParser()
store = {}  # 세션별 대화 기록 저장소

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

# 요청 모델 정의
class SpeechRequest(BaseModel):
    text: str
    session_id: str = "default_session"

# 세션별 카운트 관리
session_counts = {}

class ResetCountRequest(BaseModel):
    session_id: str

@app.post("/reset_count")
async def reset_count(request: Request):
    data = await request.json()  # JSON 형식으로 본문 데이터를 추출
    session_id = data.get("session_id", "default_session")  # 기본 세션 ID 설정
    session_counts[session_id] = 0  # 세션 카운트 초기화
    return JSONResponse(content={"message": "Count reset to 0"})

# 음성 처리 및 응답 생성 엔드포인트
@app.post("/process_speech")
async def process_speech(request: SpeechRequest):
    user_text = request.text
    session_id = request.session_id
    
    if not user_text:
        raise HTTPException(status_code=400, detail="No text provided")

    # 세션별 대화 카운트 가져오기 (기본값 0)
    count = session_counts.get(session_id, 0)
    print(count)

    if count > 5:
        user_text = "#### 대화 종료 ####"
        count = 0  # 카운트 초기화

    try:
        # 세션 설정
        config = {"configurable": {"session_id": session_id}}

        result = chain_with_history.invoke({
            "input": user_text,
            "middle_life_history": middle_life_history
        }, config=config)

        # 결과에서 응답 추출
        response = result
        count += 1
        session_counts[session_id] = count  # 세션별 카운트 업데이트
        return JSONResponse(content={"response": response})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# 인덱스 엔드포인트 (프론트엔드 페이지와 연동할 경우 사용 가능)
@app.get("/")
async def index():
    return JSONResponse(content={"message": "FastAPI 상담 봇 API입니다."})
