// ChatContainer.js
import { useState, useEffect, useRef } from 'react';
import smalllifelogo from '../images/liferary_logo.png';
import './ChatContainer.css';


// ChatContainer.js
export default function ChatContainer({ messages, onSendMessage, currentTranscript, onRecord, isRecording, isLoading }) {
  const [inputText, setInputText] = useState("");
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, currentTranscript, isLoading]); // isLoading도 추가하여 스크롤 유지

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText("");
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <img src={smalllifelogo} alt="Liferary Logo2" className="chat-header-logo" />
        <button onClick={onRecord} className="chat-button">
          {isRecording ? "말하기 중지" : "말하기 시작"}
        </button>
      </div>
      <div className="chat-messages" ref={chatContainerRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender === "user" ? "user-message" : "bot-message"}`}>
            {msg.text}
          </div>
        ))}
        {currentTranscript && <div className="chat-message user-message">{currentTranscript}</div>}
        
        {/* 로딩 스피너 표시 */}
        {isLoading && (
          <div className="chat-message bot-message loading-spinner">
            <div className="spinner"></div>
          </div>
        )}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
          placeholder="메시지를 입력하세요..."
          className="input-field"
        />
        <button onClick={handleSend} className="send-button">
          전송
        </button>
      </div>
    </div>
  );
}
