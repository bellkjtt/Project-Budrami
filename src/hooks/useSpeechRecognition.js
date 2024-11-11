import { useState, useEffect, useCallback, useRef } from 'react';

// getCookie 함수 추가
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const useSpeechRecognition = (addMessage, setIsLoading) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [middleTranscript, setMiddleTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [silenceTimer, setSilenceTimer] = useState(null);
  const currentAudioRef = useRef(null);
  const socketRef = useRef(null);  // WebSocket을 저장할 ref

  // WebSocket 초기화 및 설정
  useEffect(() => {
    socketRef.current = new WebSocket('ws://127.0.0.1:8000/ws/speech/');

    socketRef.current.onopen = () => {
      console.log("WebSocket connection opened.");
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socketRef.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('Response from backend via WebSocket:', data);

      if (data.response) {
        
        await speakResponse(data.response);
        addMessage('bot', data.response);
      }
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [addMessage]);

  // 오디오 중지 함수
  const stopCurrentAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      if (currentAudioRef.current.src) {
        URL.revokeObjectURL(currentAudioRef.current.src);
      }
      currentAudioRef.current = null;
    }
  }, []);

  // TTS 함수
  const speakResponse = useCallback(async (text) => {
    try {
      stopCurrentAudio(); // 기존 오디오 중지

      const response = await fetch('http://127.0.0.1:3389/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text }),
      });

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      currentAudioRef.current = audio;

      setIsLoading(false); // 메세지 수신 시 로딩 종료
      audio.play();
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };
      console.timeEnd('tts2')
    } catch (error) {
      console.error('TTS Error:', error);
      currentAudioRef.current = null;
    }
  }, [stopCurrentAudio]);

  // WebSocket을 통해 텍스트 전송
  const sendToBackend = useCallback((transcript) => {
    stopCurrentAudio();
    console.time("tts2");
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        text: transcript,
        session_id: 'default_session'
      }));
    } else {
      console.error('WebSocket is not open.');
    }
  }, [stopCurrentAudio]);

  // 음성 인식 초기화
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognitionInstance = new window.webkitSpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'ko-KR';

      recognitionInstance.onstart = () => {
        console.log('Speech recognition started');
        stopCurrentAudio();
      };

      recognitionInstance.onresult = (event) => {
        let currentInterimTranscript = '';
        let currentFinalTranscript = '';

        if (event.results.length > 0) {
          stopCurrentAudio();
        }

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinalTranscript += event.results[i][0].transcript + ' ';
          } else {
            currentInterimTranscript += event.results[i][0].transcript;
          }
        }

        setInterimTranscript(currentInterimTranscript);

        if (currentFinalTranscript) {
          setFinalTranscript(currentFinalTranscript);
          setMiddleTranscript(prev => prev + currentFinalTranscript);

          if (silenceTimer) {
            clearTimeout(silenceTimer);
          }

          const newTimer = setTimeout(() => {
            if (currentFinalTranscript.trim()) {
              sendToBackend(currentFinalTranscript);
            }
            setMiddleTranscript('');
          }, 750);

          setSilenceTimer(newTimer);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech' || event.error === 'aborted') {
          console.log(`Speech recognition error ignored: ${event.error}`);
          return;
        }
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        if (isListening) {
          recognitionInstance.stop();
        }
      };

      setRecognition(recognitionInstance);
    }
  }, [sendToBackend]);

  const startListening = useCallback(() => {
    if (recognition) {
      stopCurrentAudio(); // recognition 시작 전 현재 재생 중인 오디오 중지
      recognition.start();
      setIsListening(true);
      setInterimTranscript('');
      setFinalTranscript('');
      setMiddleTranscript('');
    }
  }, [recognition, stopCurrentAudio]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      const finalText = middleTranscript.trim();
      if (finalText) {
        addMessage('user', finalText);
        sendToBackend(finalText);
      }
    }
  }, [recognition, silenceTimer, middleTranscript, addMessage, sendToBackend]);

  return {
    isListening,
    interimTranscript,
    finalTranscript,
    startListening,
    stopListening,
    sendToBackend,  // 외부에서 사용할 수 있도록 export
    stopCurrentAudio // 외부에서 사용할 수 있도록 export
  };
};

export default useSpeechRecognition;
