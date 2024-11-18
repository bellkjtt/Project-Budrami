import os
import json
import time
import logging
import paramiko
from scp import SCPClient
from dotenv import load_dotenv
from lumaai import LumaAI
from cloudinary import config as cloudinary_config
from cloudinary.uploader import upload as cloudinary_upload
import getpass
import requests

# 로깅 설정
logging.basicConfig(level=logging.INFO)

# .env 파일 로드
load_dotenv()

# 환경 변수에서 API 키 가져오기
api_key = os.getenv("LUMAAI_API_KEY")
if not api_key:
    raise ValueError("LUMAAI_API_KEY 환경 변수가 설정되어 있지 않습니다.")

# LumaAI 클라이언트 설정
client = LumaAI(auth_token=api_key)

# Cloudinary 설정
cloudinary_cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
cloudinary_api_key = os.getenv('CLOUDINARY_API_KEY')
cloudinary_api_secret = os.getenv('CLOUDINARY_API_SECRET')
if not all([cloudinary_cloud_name, cloudinary_api_key, cloudinary_api_secret]):
    raise ValueError("Cloudinary API 환경 변수가 설정되어 있지 않습니다.")

cloudinary_config(
    cloud_name=cloudinary_cloud_name,
    api_key=cloudinary_api_key,
    api_secret=cloudinary_api_secret
)

# SSH 정보 설정
ssh_server_ip = "185.150.27.254"  # Vast AI 서버의 공인 IP 주소
ssh_port = 13761  # SSH 포트 번호
ssh_username = "root"

remote_directory = "/workspace/ComfyUI/output"  # ComfyUI 출력 디렉토리
local_directory = "./images"  # 로컬 저장 디렉토리
os.makedirs(local_directory, exist_ok=True)


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


def generate_video_with_lumaai(cloudinary_url):
    """LumaAI를 통해 비디오 생성하고 로컬에 다운로드"""
    try:
        generation = client.generations.create(
            prompt="The person in the scene should have minimal movement, with gentle, subtle motions like breathing or slight head turns",
            keyframes={
                "frame0": {
                    "type": "image",
                    "url": cloudinary_url
                }
            }
        )
        logging.info("LumaAI를 통해 비디오 생성 중...")
        completed = False
        while not completed:
            time.sleep(10)
            generation = client.generations.get(id=generation.id)
            if generation.state == "completed":
                completed = True
                video_url = generation.assets.video

                # 비디오 다운로드
                video_response = requests.get(video_url, stream=True)
                video_path = f"{generation.id}.mp4"
                with open(video_path, 'wb') as video_file:
                    for chunk in video_response.iter_content(chunk_size=1024):
                        if chunk:
                            video_file.write(chunk)
                logging.info(f"비디오가 로컬에 다운로드되었습니다: {video_path}")
                return video_path
            elif generation.state == "failed":
                raise RuntimeError(f"비디오 생성 실패: {generation.failure_reason}")
            else:
                logging.info("비디오 생성 중... 잠시만 기다려주세요.")
    except Exception as e:
        logging.error(f"LumaAI 비디오 생성 중 오류 발생: {e}")
        raise


def main():
    try:
        # ComfyUI 워크플로우 JSON 로드
        with open("workflow_api.json") as f:
            workflow = json.load(f)

        # 프롬프트 수정
        for key, node in workflow.items():
            if isinstance(node, dict) and node.get("class_type") == "CLIPTextEncode":
                node["inputs"]["text"] = "A serene post-war Korean village, children playing joyfully by a clear, sparkling stream under a warm sun, skipping stones and catching minnows, lush greenery and traditional Korean houses in the background, peaceful smiles, the essence of childhood innocence and hope amidst a landscape that has seen hardship, soft sunlight casting gentle shadows, vibrant yet calming colors, capturing the beauty of resilience and new beginnings."

        # 서버의 ComfyUI API URL 설정
        server_address = "http://127.0.0.1:8189"

        # API 요청 데이터 구성
        data = {"prompt": workflow}

        # API 요청 보내기
        response = requests.post(f"{server_address}/prompt", json=data)
        if response.status_code == 200:
            logging.info("프롬프트가 성공적으로 큐에 추가되었습니다!")
        else:
            logging.error(f"프롬프트 전송 오류: {response.status_code} - {response.text}")
            return

        # SSH 비밀번호를 안전하게 입력받기
        ssh_password = getpass.getpass(prompt='SSH 비밀번호를 입력하세요: ')

        # SSH 클라이언트 설정
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ssh_server_ip, port=ssh_port, username=ssh_username, password=ssh_password, timeout=10)
        logging.info("SSH 연결이 성공적으로 이루어졌습니다.")

        # 최신 이미지 파일 경로 가져오기
        remote_image_path = get_latest_file_path(ssh, remote_directory)
        file_name = os.path.basename(remote_image_path)
        local_image_path = os.path.join(local_directory, file_name)

        # SSH를 통해 파일 다운로드
        download_image_via_ssh(ssh, remote_image_path, local_image_path)

        # SSH 연결 종료
        ssh.close()
        logging.info("SSH 연결이 종료되었습니다.")

        # Cloudinary에 이미지 업로드
        upload_result = cloudinary_upload(local_image_path, public_id='test_image', overwrite=True)
        cloudinary_url = upload_result['secure_url']
        logging.info(f"Cloudinary에 이미지 업로드 완료: {cloudinary_url}")

        # LumaAI API에 이미지 URL 전달하여 비디오 생성
        # generate_video_with_lumaai(cloudinary_url)

    except Exception as e:
        logging.error(f"전체 과정 중 오류 발생: {e}")


if __name__ == "__main__":
    main()