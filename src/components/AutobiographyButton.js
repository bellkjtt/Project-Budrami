import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AutobiographyButton.css';

const AutobiographyButton = ({ onAddCard }) => {
  const [alsoisLoading, setAlsoIsLoading] = useState(false); // 로딩 상태 추가
  const navigate = useNavigate();

  const handleClick = async () => {
    setAlsoIsLoading(true); // 로딩 시작
    try {
      const response = await fetch('http://127.0.0.1:8000/save_conversation/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Failed to save conversation.');
      }

      const data = await response.json();
      const imagePrompt = data.image_prompt;
      const title = imagePrompt.title;
      const subtitle = imagePrompt.subtitle;

      const imageResponse = await fetch('http://127.0.0.1:8000/generate_image/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });

      if (!imageResponse.ok) {
        throw new Error('Failed to generate image.');
      }

      const imageData = await imageResponse.json();
      const generatedImageUrl = imageData.image_url;

      const newCard = {
        id: 4,
        title: title,
        subtitle: subtitle,
        image: generatedImageUrl,
      };

      onAddCard(newCard);
      navigate('/gallary');
    } catch (error) {
      console.error('Error processing image:', error);
      alert('이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setAlsoIsLoading(false);
    }
  };

  return (
    <button
      className="autobiography-button"
      onClick={handleClick}
      disabled={alsoisLoading} // 로딩 중에는 클릭 비활성화
    >
      {alsoisLoading? (
        <div className="loading-spinner2"></div> // 로딩 스피너 표시
      ) : (
        '나의 이야기 만들기'
      )}
    </button>
  );
};

export default AutobiographyButton;
