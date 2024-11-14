// ChatHeader.js
import React from 'react';
import userIcon from '../../images/Male User.png'; // Adjust the path to where the image is located
import './ChatHeader.css'; // Adjust to your header styling file

function ChatHeader() {
  return (
    <header className="chat-header">
      <img src={userIcon} alt="User Icon" className="user-icon" />
    </header>
  );
}

export default ChatHeader;
