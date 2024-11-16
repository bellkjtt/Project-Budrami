// ChatPAge.js
import { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/ChatPage.css';
import Camera from '../components/Camera';
import StepTracker from '../components/StepTracker';
// import Header from '../components/common/Header';
import ChatContainer from '../components/ChatContainer';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import AutobiographyButton from '../components/AutobiographyButton';
import ChatHeader from '../components/common/ChatHeader'; // Import the custom header

function ChatPage({onAddCard}) {
  const [messages, setMessages] = useState([]);
  const [audioContext, setAudioContext] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(4);

  const addMessage = useCallback((sender, text) => {
    setMessages(prevMessages => [...prevMessages, { sender, text }]);
  }, []);

  useEffect(() => {
    console.log("Updated currentStep_chatPage:", currentStep);
  }, [currentStep]);


  const {
    isListening,
    interimTranscript,
    finalTranscript,
    startListening,
    stopListening,
    sendToBackend
  } = useSpeechRecognition(addMessage, setIsLoading, currentStep, setCurrentStep);

  const handleStepChange = (step) => {
    setCurrentStep(step); // 최신 step 값 업데이트
  };

  useEffect(() => {
    const resetCount = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/reset_count', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ session_id: 'default_session' })
        });
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to reset count:', error);
      }
    };

    resetCount();
  }, []);

  const handleRecord = async () => {
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    if (isListening) {
      // console.log("Stopping listening at:", new Date().toLocaleString());
      stopListening();
    } else {
      // console.log("Starting listening at:", new Date().toLocaleString());
      startListening();
    }
  };

  const handleSendMessage = async (message) => {
    if (message.trim()) {
      addMessage('user', message);

      setIsLoading(true); // 로딩 시작
      // console.log("Setting isLoading to ", isLoading);
      await sendToBackend(message);
      // console.log("Setting isLoading to ", isLoading);
      // setIsLoading(false); // 로딩 종료
    }
  };

  useEffect(() => {
    if (finalTranscript) {
      addMessage('user', finalTranscript);
    }
  }, [finalTranscript, addMessage]);

  return (
    <div className="main-container">
      <main className="main-content">
      <StepTracker setCurrentStep={setCurrentStep} currentStep={currentStep} />
      {currentStep >= 4 && <AutobiographyButton onAddCard={onAddCard} />}
        <div className="chat-wrapper">
          <Camera />
          <div className="chat-section">
            <ChatContainer
              messages={messages}
              onSendMessage={handleSendMessage}
              currentTranscript={interimTranscript}
              onRecord={handleRecord}
              isRecording={isListening}
              isLoading={isLoading} // 추가된 속성
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default ChatPage;




