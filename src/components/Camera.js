import { useEffect, useRef, useState } from 'react';
import './Camera.css';
import close from '../images/close.png';

const ToggleSwitch = ({ isOn, onToggle, disabled }) => (
  <label className="toggle-switch">
    <input type="checkbox" checked={isOn} onChange={onToggle} disabled={disabled} />
    <span className="slider"></span>
  </label>
);

const Camera = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null); // 카메라 스트림 저장
  const wsRef = useRef(null); // WebSocket 저장
  const [cameraError, setCameraError] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true); // 카메라 상태 관리
  const [isToggleOn, setIsToggleOn] = useState(false); // 토글 상태 관리
  const [originalModelID, setOriginalModelID] = useState(null); // 원래 모델 ID 저장
  const [isAuthenticated, setIsAuthenticated] = useState(false); // 인증 상태 관리
  const [isCooldown, setIsCooldown] = useState(false); // 쿨다운 상태 관리
  const [showCooldownAlert, setShowCooldownAlert] = useState(false); // 알림 상태 관리
  const lastModelChangeRef = useRef(0); // 모델 전환 쿨다운 시간 관리

  const setAuthToken = (token) => {
    localStorage.setItem('VTS_AUTH_TOKEN', token);
  };

  const getAuthToken = () => localStorage.getItem('VTS_AUTH_TOKEN');

  // useEffect(() => {
  //   // 새로고침 시 로컬 스토리지 초기화
  //   window.onload = () => {
  //     localStorage.clear();
  //   };
  // }, []);

  const initializeCamera = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');
      const obsCamera = videoDevices.find((device) => device.label.includes('OBS Virtual Camera'));

      if (obsCamera) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: obsCamera.deviceId },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        setCameraError('OBS 가상 카메라가 감지되지 않았습니다.');
      }
    } catch (err) {
      setCameraError('카메라 초기화 중 오류 발생: ' + err.message);
    }
  };

  const connectWebSocket = () => {
    const ws = new WebSocket('ws://127.0.0.1:8001');

    ws.onopen = () => {
      const existingToken = getAuthToken();
      if (existingToken) {
        // 기존 토큰이 있으면 인증 요청만 수행
        const authPayload = {
          apiName: 'VTubeStudioPublicAPI',
          apiVersion: '1.0',
          requestID: 'authentication',
          messageType: "AuthenticationRequest",
          data: {
            pluginName: 'MyVTubePlugin',
            pluginDeveloper: 'YourName',
            pluginIcon: close,
            authenticationToken: existingToken,
          },
        };
        ws.send(JSON.stringify(authPayload));
      } else {
        // 기존 토큰이 없으면 새 토큰 요청
        const payload = {
          apiName: 'VTubeStudioPublicAPI',
          apiVersion: '1.0',
          requestID: 'authTokenRequest',
          messageType: 'AuthenticationTokenRequest',
          data: { pluginName: 'MyVTubePlugin', pluginDeveloper: 'YourName' },
        };
        ws.send(JSON.stringify(payload));
      }
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.messageType === 'AuthenticationTokenResponse') {
        const token = message.data.authenticationToken;
        setAuthToken(token);

        const authPayload = {
          apiName: 'VTubeStudioPublicAPI',
          apiVersion: '1.0',
          requestID: 'authentication',
          messageType: "AuthenticationRequest",
          data: {
            pluginName: 'MyVTubePlugin',
            pluginDeveloper: 'YourName',
            authenticationToken: token,
          },
        };
        ws.send(JSON.stringify(authPayload));
      }

      if (message.messageType === 'AuthenticationResponse' && message.data?.authenticated) {
        setIsAuthenticated(true);

        const currentModelPayload = {
          apiName: 'VTubeStudioPublicAPI',
          apiVersion: '1.0',
          requestID: 'currentModel',
          messageType: "CurrentModelRequest",
        };
        ws.send(JSON.stringify(currentModelPayload));
      }

      if (message.messageType === 'APIError') {
        console.error('API 오류 발생:', message.data.message);
        setIsToggleOn((prev) => !prev); // 실패 시 토글 상태 복구
      }

      if (message.messageType === 'AvailableModelsResponse') {
        const models = message.data.availableModels;
        const currentModel = models.find((model) => model.modelLoaded);
        if (currentModel) setOriginalModelID(currentModel.modelID);
      }
    };

    ws.onerror = (err) => console.error('WebSocket 오류:', err.message);
    ws.onclose = () => console.log('WebSocket 연결 종료');
    wsRef.current = ws;
  };

  const sendModelChangeRequest = (modelID) => {
    if (!isAuthenticated) {
      console.error('세션 인증이 완료되지 않았습니다. 요청을 보낼 수 없습니다.');
      return;
    }

    const currentTime = Date.now();
    if (currentTime - lastModelChangeRef.current < 2000) {
      setShowCooldownAlert(true); // 알림 표시
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        apiName: 'VTubeStudioPublicAPI',
        apiVersion: '1.0',
        requestID: 'modelChange',
        messageType: 'ModelLoadRequest',
        data: {
          modelID,
        },
      };
      wsRef.current.send(JSON.stringify(payload));
      lastModelChangeRef.current = currentTime; // 쿨다운 시간 업데이트

      setIsCooldown(true);
      setTimeout(() => setIsCooldown(false), 2000); // 2초 후 쿨다운 종료
    }
  };

  const toggleModel = () => {
    setIsToggleOn((prev) => {
      const newState = !prev;
      const targetModelID = newState
        ? "1cac9cb8d1ea480bb37a4befb11826ae"
        : "0fe866eecefa4cf3b7c943d3bb2c5ff2";

      sendModelChangeRequest(targetModelID);

      return newState;
    });
  };

  useEffect(() => {
    if (isCameraOn) initializeCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraOn]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return (
    <div className="camera-section">
      <div className="camera-toggle-container">
        <ToggleSwitch isOn={isToggleOn} onToggle={toggleModel} disabled={isCooldown} />
      </div>
      {cameraError ? (
        <div className="camera-error">{cameraError}</div>
      ) : (
        <video ref={videoRef} autoPlay playsInline className="camera-video" />
      )}
      {showCooldownAlert && (
        <div className="cooldown-alert">
          <p>2초의 쿨타임이 있습니다</p>
          <button onClick={() => setShowCooldownAlert(false)}>확인</button>
        </div>
      )}
    </div>
  );
};

export default Camera;
