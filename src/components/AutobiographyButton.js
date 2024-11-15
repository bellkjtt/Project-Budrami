// AutobiographyButton.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AutobiographyButton.css';

const AutobiographyButton = () => {
  const navigate = useNavigate();

  const handleClick = async () => {
    try {
      // 대화 데이터를 저장하는 Django API 호출
      const response = await fetch('http://127.0.0.1:8000/save_conversation/', {
        method: 'POST',
        credentials: 'include',  // 세션 쿠키 포함 설정
        headers: {
          'Content-Type': 'application/json',
        },
        // credentials: 'same-origin', // 세션 쿠키를 포함하여 요청 보냄
      });
      console.log(response,'받은 에러')
      if (!response.ok) {
        throw new Error('Failed to save conversation.');
      }

      // 성공 시 '/gallary' 페이지로 이동
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
