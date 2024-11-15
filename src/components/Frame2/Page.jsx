// src/components/Frame2/Page.jsx
import React from 'react';
import './Page.css';

const Page = ({ videoSrc, title, quote, text }) => {
  return (
    <div className="page">
      {/* 배경 비디오 */}
      <video
        src={videoSrc}
        className="background-video"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* 콘텐츠 영역 */}
      <div className="content">
        <div className="left-panel">
          <div className="title">{title}</div>
          <div className="quote">{quote}</div>
        </div>
        <div className="right-panel">
          <p>{text}</p>
        </div>
      </div>
    </div>
  );
};

export default Page;