// App.js
import { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/App.css';
import Camera from '../components/Camera';
import StepTracker from '../components/StepTracker';
import Header from '../components/common/Header';
import ChatContainer from '../components/ChatContainer';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

function App() {
  const [messages, setMessages] = useState([]);
  const [audioContext, setAudioContext] = useState(null);

  const addMessage = useCallback((sender, text) => {
    setMessages(prevMessages => [...prevMessages, { sender, text }]);
  }, []);

  const {
    isListening,
    interimTranscript,
    finalTranscript,
    startListening,
    stopListening,
    sendToBackend
  } = useSpeechRecognition(addMessage);

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
      console.log("Stopping listening at:", new Date().toLocaleString());
      stopListening();
    } else {
      console.log("Starting listening at:", new Date().toLocaleString());
      startListening();
    }
  };

  const handleSendMessage = async (message) => {
    if (message.trim()) {
      addMessage('user', message);
      await sendToBackend(message);
    }
  };

  useEffect(() => {
    if (finalTranscript) {
      addMessage('user', finalTranscript);
    }
  }, [finalTranscript, addMessage]);

  return (
    <div className="main-container">
      {/* <Header /> */}
      
      <main className="main-content">
      <StepTracker />
        <div className="chat-wrapper">
        <Camera />
          <div className="chat-section">
            <ChatContainer
              messages={messages}
              onSendMessage={handleSendMessage}
              currentTranscript={interimTranscript}
              onRecord={handleRecord}
              isRecording={isListening}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;


