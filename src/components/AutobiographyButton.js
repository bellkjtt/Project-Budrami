import React from 'react';
import { useNavigate } from 'react-router-dom'; // useNavigate 추가
import './AutobiographyButton.css';
import image from '../images/gemini_logo_color.jpg';

const AutobiographyButton = ({ onAddCard }) => {
  const navigate = useNavigate(); // navigate 훅 생성

  console.log('onAddCard:', typeof onAddCard, onAddCard); // 디버그

  const handleClick = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/save_conversation/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Failed to save conversation.');
      }

      const newCard = { id: 4, title: "새로운 이야기", subtitle: "추가된 카드입니다.", image: image };
      onAddCard(newCard); // 카드 추가

      // 갤러리 페이지로 이동
      navigate('/gallary');
    } catch (error) {
      console.error('Error saving conversation:', error);
      alert('대화 저장에 실패했습니다.');
    }
  };

  return (
    <button className="autobiography-button" onClick={handleClick}>
      나의 이야기 만들기
    </button>
  );
};

export default AutobiographyButton;
