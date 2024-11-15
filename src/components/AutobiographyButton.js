// AutobiographyButton.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AutobiographyButton.css';

const AutobiographyButton = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/gallary'); // '/target-page'를 이동하고 싶은 경로로 바꾸세요
  };

  return (
    <button className="autobiography-button" onClick={handleClick}>
      나의 이야기 만들기
    </button>
  );
};

export default AutobiographyButton;
