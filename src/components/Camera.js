// components/Camera.js
import { useEffect, useRef, useState } from 'react';
import './Camera.css';

const Camera = () => {
  const videoRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        const obsCamera = videoDevices.find(device => device.label.includes('OBS Virtual Camera'));

        if (obsCamera) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: obsCamera.deviceId }
          });
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

    initializeCamera();
  }, []);

  return (
    <div className="camera-section">
      {cameraError ? (
        <div className="camera-error">{cameraError}</div>
      ) : (
        <video ref={videoRef} autoPlay playsInline className="camera-video" />
      )}
    </div>
  );
};

export default Camera;
