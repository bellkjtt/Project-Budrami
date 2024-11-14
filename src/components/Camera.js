import { useEffect, useRef, useState } from 'react';
import './Camera.css';


const ToggleSwitch = ({ isOn, onToggle }) => (
  <label className="toggle-switch">
    <input type="checkbox" checked={isOn} onChange={onToggle} />
    <span className="slider"></span>
  </label>
);

const Camera = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null); // 카메라 스트림을 저장할 ref
  const [cameraError, setCameraError] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true); // 카메라 상태 관리

  const initializeCamera = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const obsCamera = videoDevices.find(device => device.label.includes('OBS Virtual Camera'));

      if (obsCamera) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: obsCamera.deviceId }
        });
        streamRef.current = stream; // 스트림 저장
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        setCameraError("OBS 가상 카메라가 감지되지 않았습니다.");
      }
    } catch (err) {
      setCameraError("카메라 초기화 중 오류 발생: " + err.message);
    }
  };

  useEffect(() => {
    if (isCameraOn) {
      initializeCamera();
    }

    // 컴포넌트 언마운트 시 스트림 정리
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOn]);

  const toggleCamera = () => {
    if (isCameraOn) {
      // 카메라 끄기
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsCameraOn(false);
      setCameraError("카메라가 꺼졌습니다.");
    } else {
      // 카메라 켜기
      setCameraError(null);
      setIsCameraOn(true);
    }
  };

  return (
    <div className="camera-section">
      <div className="camera-toggle-container">
        {/* <span className="toggle-label">카메라 {isCameraOn ? '켜짐' : '꺼짐'}</span> */}
        <ToggleSwitch isOn={isCameraOn} onToggle={toggleCamera} />
      </div>
      {cameraError ? (
        <div className="camera-error">{cameraError}</div>
      ) : (
        <video ref={videoRef} autoPlay playsInline className="camera-video" />
      )}
    </div>
  );
};

export default Camera;
