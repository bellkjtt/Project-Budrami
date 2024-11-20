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
llm = ChatOpenAI(model='gpt-4o', temperature=0.2)
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


# @csrf_exempt
# def save_dialogues(request):
#     if request.method != 'POST':
#         return JsonResponse({'error': 'POST 요청만 허용됩니다.'}, status=405)

#     # 세션 ID 가져오기 (기본값 'default_session')
#     session_id = request.session.get('session_id', 'default_session')

#     # store에서 대화 기록 가져오기
#     dialogues = get_dialogues_from_store(session_id)
#     if not dialogues:
#         return JsonResponse({'message': '저장할 대화가 없습니다.'}, status=400)

#     try:
#         with transaction.atomic():
#             # DB에 대화 기록 저장
#             for dialogue in dialogues:
#                 # HumanMessage와 AIMessage에 따라 message_type 설정
#                 message_type = 'human' if isinstance(dialogue, HumanMessage) else 'ai'

#                 Dialog.objects.create(
#                     session_id=session_id,
#                     content=dialogue.content,  # 메시지 내용 저장
#                     message_type=message_type  # 메시지 유형 저장
#                 )
        
#         return JsonResponse({'message': '대화가 성공적으로 저장되었습니다.'})
#     except Exception as e:
#         return JsonResponse({'error': f'저장 중 오류 발생: {str(e)}'}, status=500)

import logging
from openai import OpenAI
import json

# 로그 설정
logging.basicConfig(level=logging.DEBUG, filename='debug.log', filemode='a',
                    format='%(asctime)s - %(levelname)s - %(message)s')

@csrf_exempt
def save_dialogues(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST 요청만 허용됩니다.'}, status=405)

    logging.debug("save_dialogues 함수 호출 - POST 요청 확인")

    # 세션 ID 가져오기
    session_id = request.session.get('session_id', 'default_session')
    logging.debug(f"세션 ID: {session_id}")

    # store에서 대화 기록 가져오기
    dialogues = get_dialogues_from_store(session_id)
    if not dialogues:
        logging.debug("대화 기록 없음")
        return JsonResponse({'message': '저장할 대화가 없습니다.'}, status=400)

    try:
        with transaction.atomic():
            # DB에 대화 기록 저장
            logging.debug("DB에 대화 기록 저장 시작")
            for dialogue in dialogues:
                message_type = 'human' if isinstance(dialogue, HumanMessage) else 'ai'
                logging.debug(f"저장 중: {dialogue.content} (유형: {message_type})")
                Dialog.objects.create(
                    session_id=session_id,
                    content=dialogue.content,
                    message_type=message_type
                )

            # Function Calling으로 이미지 프롬프트 생성
            logging.debug("이미지 프롬프트 생성 시작")
            response = generate_image_prompt(dialogues)
            
            if 'error' in response:
                logging.error(f"이미지 프롬프트 생성 오류: {response['error']}")
                return JsonResponse({'error': response['error']}, status=500)

        logging.debug("대화 저장 및 이미지 프롬프트 생성 완료")
        return JsonResponse({
            'message': '대화가 성공적으로 저장되었습니다.',
            'image_prompt': response['data']  # GPT에서 반환된 JSON 데이터를 포함
        })
    except Exception as e:
        logging.error(f"저장 중 오류 발생: {str(e)}")
        return JsonResponse({'error': f'저장 중 오류 발생: {str(e)}'}, status=500)


# GPT 함수 호출 스키마 정의
def generate_image_prompt(dialogues):
    try:
        # 대화 내용을 하나의 텍스트로 결합
        combined_text = " ".join([dialogue.content for dialogue in dialogues])
        logging.debug(f"GPT 호출 입력 텍스트: {combined_text}")

        # Function 정의
       # Function 정의
        functions = [
        {
        "name": "generate_image_prompt",
        "description": (
            "대화 내용을 바탕으로 이미지 프롬프트를 생성합니다. "
            "완성된 description(이미지 프롬프트) 예시는 다음과 같습니다. "
            "```A serene post-war Korean village, children playing joyfully by a clear, sparkling stream under a warm sun,skipping stones and catching minnows, lush greenery and traditional Korean houses in the background, peaceful smiles, the essence of childhood innocence and hope amidst a landscape that has seen hardship, soft sunlight casting gentle shadows, vibrant yet calming colors, capturing the beauty of resilience and new beginnings.``` "
            "또한 title의 예시들은 다음과 같습니다. "
            "```꿈과 사랑으로 일군 인생``` ```감사속에 피어난 아름다움``` ```가족과 함께 단란한 시간을``` " 
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "대화를 요약해서 가장 맞는 타이틀"
                },
                "description": {
                    "type": "string",
                    "description": "이미지에 대한 세부 설명"
                },
                "subtitle": {
                    "type": "string",
                    "description": (
                        "title에 맞는 quote. 예시: '''가족과 이웃, 나를 지켜준 힘''' "
                        "'''붓을 내려놓고, 가정을 품다.''' '''위기 속에서 하나 된 가족'''"
                    )
                },
                "text": {
                    "type": "string",
                    "description": """이미지 프롬프트와 대화를 바탕으로 텍스트 내용을 생성합니다. 예시: ```중년이 되면서 내 삶의 중심은 가족이었다. 아이들이 자라나는 모습을 지켜보며 “너희는 무엇이든 할 수 있어”라는 말로 자신감을 키워주었다. 큰아들의 대학 합격은 지금도 가슴 벅찬 기억이다. 남편의 사업 실패로 어려움을 겪었지만, 가족이 힘을 합쳐 극복해냈다. 중년이 되며 삶에 여유를 찾고, 부모님을 더 잘 돌보지 못한 아쉬움이 남지만, 가족을 위해 헌신했던 시간이 나를 더 강하게 만들었다.``` 
                    "```젊은 시절, 나는 미술 선생님이 되고 싶었다. 공원에서 혼자 풍경을 그리는 걸 좋아했고, 친구들에게 그림을 가르치는 것도 즐거웠다. 그러나 가정 형편 때문에 꿈을 이루지 못하고 결혼 후 남편과 아이들을 돌보는 것이 내 삶의 중심이 되었다. 경제적 어려움 속에서도 가족은 서로를 도우며 어려움을 극복했고, 그 과정에서 더 단단해졌다. 함께한 모든 순간이 내게는 소중한 보물이다.```"  
                    """
                }
            },
            "required": ["title", "description", "subtitle", "text"]
            }
            }
        ]


        client = OpenAI(
            api_key=openai_api_key,  # This is the default and can be omitted
            )
        # GPT 호출

        logging.debug("GPT 호출 시작")
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an assistant that generates structured JSON outputs for image prompts."},
                {"role": "user", "content": f"Summarize the dialogue and create an image prompt: {combined_text}"}
            ],
            functions=functions,
            function_call={"name": "generate_image_prompt"}  # 특정 함수 호출 강제
        )

        logging.debug(f"GPT 응답: {response}")
        # print(response.choices[0].message.content,'')
        # GPT 응답에서 함수 호출 결과 추출
        function_args = json.loads(response.choices[0].message.function_call.arguments)
        logging.debug(f"GPT에서 생성된 JSON: {function_args}")
        return {"data": function_args}
    except Exception as e:
        logging.error(f"GPT 호출 중 오류 발생: {str(e)}")
        return {"error": f"GPT 호출 중 오류 발생: {str(e)}"}



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
        
        selected_role = role_dict.get(role_num, elderly_role)

        try:
            # 세션에서 count 가져오기 (초기값은 0)
            count = request.session.get('count', 0)

            if count > 10:
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
            if role_num==3:
                return JsonResponse({'response': response, 'step' : 4})
            return JsonResponse({'response': response})

        except Exception as e:
            return JsonResponse({'error': f'An error occurred: {str(e)}'}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=400)


# views.py
# views.py
import os
import json
import time
import logging
import requests  # 추가된 부분
import paramiko
from scp import SCPClient
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from cloudinary import uploader as cloudinary_uploader
from lumaai import LumaAI
from urllib.parse import urljoin


ssh_server_ip = "185.150.27.254"  # Vast AI 서버의 공인 IP 주소
ssh_port = 13761  # SSH 포트 번호
ssh_username = "root"

remote_directory = "/workspace/ComfyUI/output"  # ComfyUI 출력 디렉토리
local_directory = "./media/images"  # 로컬 저장 디렉토리
os.makedirs(local_directory, exist_ok=True)

# 로깅 설정 강화
logger = logging.getLogger(__name__)

def setup_ssh_connection():
    """SSH 연결 설정"""
    try:
        # 더 자세한 로깅 설정
        logging.getLogger("paramiko").setLevel(logging.DEBUG)
        
        # Windows 환경에서 SSH 키 경로 직접 지정
        ssh_key_path = r"C:\Users\Guest_KDT\.ssh\id_rsa"
        logging.info(f"Using SSH key from: {ssh_key_path}")
        
        # SSH 클라이언트 설정
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # 개인키 존재 확인
        if not os.path.exists(ssh_key_path):
            raise FileNotFoundError(f"SSH private key not found at {ssh_key_path}")
            
        # 개인키 로드 시도
        try:
            logging.info("Attempting to load private key...")
            private_key = paramiko.RSAKey.from_private_key_file(ssh_key_path)
            logging.info("Private key loaded successfully")
        except paramiko.ssh_exception.PasswordRequiredException:
            passphrase = getpass.getpass('Enter passphrase for key: ')
            private_key = paramiko.RSAKey.from_private_key_file(ssh_key_path, password=passphrase)
        except Exception as e:
            logging.error(f"Failed to load private key: {e}")
            raise
        
        # SSH 연결 시도
        logging.info(f"Attempting to connect to {settings.SSH_SERVER_IP}:{settings.SSH_PORT}...")
        ssh.connect(
            ssh_server_ip,
            port=ssh_port,
            username=ssh_username,
            pkey=private_key,
            timeout=10
        )
        logging.info("SSH connection successful")
        return ssh
    except Exception as e:
        logging.error(f"SSH connection failed: {str(e)}")
        raise

def get_latest_file_path(ssh, remote_directory):
    """서버 디렉토리에서 가장 최근 파일 경로 반환"""
    try:
        stdin, stdout, stderr = ssh.exec_command(f"ls -t {remote_directory}/*.png | head -n 1")
        latest_file = stdout.read().decode().strip()
        if latest_file:
            return latest_file
        else:
            raise FileNotFoundError("지정된 디렉토리에 파일이 없습니다.")
    except Exception as e:
        logging.error(f"최신 파일을 찾는 중 오류 발생: {e}")
        raise

def download_image_via_ssh(ssh, remote_path, local_path):
    """SSH를 통해 Vast AI 서버에서 파일 다운로드"""
    try:
        with SCPClient(ssh.get_transport()) as scp:
            scp.get(remote_path, local_path)
        logging.info(f"이미지를 SSH로 다운로드했습니다: {local_path}")
    except Exception as e:
        logging.error(f"SSH로 이미지 다운로드 중 오류 발생: {e}")
        raise

@csrf_exempt
def generate_image(request):
    """이미지 생성 및 다운로드 뷰"""
    try:
        logger.info("이미지 생성 프로세스 시작")

        try:
            body = json.loads(request.body.decode('utf-8'))
            image_prompt = body.get('prompt', {}).get('description', '')
        except Exception as e:
            logger.error(f"요청 본문 파싱 실패: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': '요청 본문을 파싱하는 데 실패했습니다.'
            }, status=400)
        print(image_prompt)
        # workflow JSON 파일 경로 확인
        workflow_path = os.path.join(settings.BASE_DIR, 'workflow_api.json')
        logger.info(f"Workflow 파일 경로: {workflow_path}")
        
        # workflow 파일 존재 확인
        if not os.path.exists(workflow_path):
            logger.error(f"Workflow 파일을 찾을 수 없음: {workflow_path}")
            return JsonResponse({
                'status': 'error',
                'message': 'Workflow 파일을 찾을 수 없습니다.'
            }, status=400)

        # workflow JSON 로드
        try:
            with open(workflow_path) as f:
                workflow = json.load(f)
            logger.info("Workflow JSON 로드 성공")
        except Exception as e:
            logger.error(f"Workflow JSON 로드 실패: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': 'Workflow 파일 로드에 실패했습니다.'
            }, status=400)

        for key, node in workflow.items():
            if isinstance(node, dict) and node.get("class_type") == "CLIPTextEncode":
                node["inputs"]["text"] = image_prompt

        server_address = "http://127.0.0.1:8189"
        # ComfyUI API 요청
        try:
            logger.info(f"ComfyUI 서버 주소: {settings.COMFYUI_SERVER_ADDRESS}")
            response = requests.post(
                f"{server_address}/prompt",
                json={"prompt": workflow}
            )
            logger.info(f"ComfyUI API 응답 상태 코드: {response.status_code}")
            if response.status_code != 200:
                logger.error(f"ComfyUI API 오류 응답: {response.text}")
                return JsonResponse({
                    'status': 'error',
                    'message': f'ComfyUI API 오류: {response.status_code}'
                }, status=400)
        except Exception as e:
            logger.error(f"ComfyUI API 요청 실패: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': f'ComfyUI API 요청 실패: {str(e)}'
            }, status=500)

        # SSH 연결
        try:
            logger.info(f"SSH 연결 시도: {settings.SSH_SERVER_IP}:{settings.SSH_PORT}")
            ssh = setup_ssh_connection()
            logger.info("SSH 연결 성공")
        except Exception as e:
            logger.error(f"SSH 연결 실패: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': f'SSH 연결 실패: {str(e)}'
            }, status=500)

        try:
            # 최신 이미지 파일 경로 가져오기
            remote_image_path = get_latest_file_path(ssh, settings.REMOTE_DIRECTORY)
            logger.info(f"원격 이미지 경로: {remote_image_path}")
            file_name = os.path.basename(remote_image_path)
            
            local_image_path = os.path.join(local_directory, file_name).replace('\\', '/')
            # print(local_image_path,'합친 경로')
            # 이미지 다운로드
            local_file_path = download_image_via_ssh(ssh, remote_image_path, local_image_path)
            logger.info(f"로컬 파일 경로: {local_file_path}")

            # 이미지 URL 생성
            image_url = request.build_absolute_uri(settings.MEDIA_URL + local_image_path)
            # print(image_url,'첫번쨰 URL')
            image_url = image_url.replace('\\', '/')
            # print(image_url,'두번째 URL')
            generated_image_url = urljoin('http://127.0.0.1:8000/media/', image_url.split('media/')[-1])
            #print(generated_image_url,'세번쨰 URL')
            logger.info(f"생성된 이미지 URL: {generated_image_url}")

            return JsonResponse({
                'status': 'success',
                'image_url': generated_image_url
            })

        except Exception as e:
            logger.error(f"이미지 처리 중 오류 발생: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': f'이미지 처리 중 오류 발생: {str(e)}'
            }, status=500)

        finally:
            if ssh:
                ssh.close()
                logger.info("SSH 연결 종료")

    except Exception as e:
        logger.error(f"예상치 못한 오류: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'서버 오류가 발생했습니다: {str(e)}'
        }, status=500)