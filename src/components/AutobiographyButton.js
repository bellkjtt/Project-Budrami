import React from 'react';
import { useNavigate } from 'react-router-dom'; // useNavigate 추가
import './AutobiographyButton.css';
// import image from '../images/gemini_logo_color.jpg';

const AutobiographyButton = ({ onAddCard }) => {
  const navigate = useNavigate(); // navigate 훅 생성

  // console.log('onAddCard:', typeof onAddCard, onAddCard); // 디버그

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
  
      const data = await response.json(); // JSON 데이터 받아오기
      console.log(data.image_prompt)
      const imagePrompt = data.image_prompt; // image_prompt 추출
      const title = data.image_prompt.title;
      const subtitle = data.image_prompt.subtitle;
      if (!imagePrompt) {
        throw new Error('Image prompt is missing from the response.');
      }
  
      // 이미지 생성 API로 image_prompt 보내기
      const imageResponse = await fetch('http://127.0.0.1:8000/generate_image/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });
  
      if (!imageResponse.ok) {
        throw new Error('Failed to generate image.');
      }
  
      const imageData = await imageResponse.json();
      const generatedImageUrl = imageData.image_url; // 생성된 이미지 URL 받아오기
      //  const generatedImageUrl = image; // 생성된 이미지 URL 받아오기

      const newCard = {
        id: 4,
        title: title,
        subtitle: subtitle,
        image: generatedImageUrl, // 생성된 이미지 URL 사용
      };
  
      onAddCard(newCard); // 카드 추가
      navigate('/gallary'); // 갤러리 페이지로 이동
    } catch (error) {
      console.error('Error processing image:', error);
      alert('이미지 처리 중 오류가 발생했습니다.');
    }
  };
  

  return (
    <button className="autobiography-button" onClick={handleClick}>
      나의 이야기 만들기
    </button>
  );
};

export default AutobiographyButton;
