import React, { useRef, useEffect, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { useNavigate, useParams } from 'react-router-dom';
import './Frame2.css';
import { Link } from 'react-router-dom';

import ArrowLeft from '../../images/arrow_left.png';
import ArrowRight from '../../images/arrow_right.png';
import CloseIcon from '../../images/close.png';
import MusicNote from '../../images/music_note.png';
import PhotoIcon from '../../images/photo.png';
import RewindIcon from '../../images/rewind.png';
import Logo from '../../images/logo.png';
import SpeakerIcon from '../../images/speaker.png'; // 스피커 아이콘 추가

const Frame2 = ({ cards: initialCards }) => {
  // const bookRef = useRef(null);
  const { pageId } = useParams(); // URL에서 pageId를 가져옴
  const navigate = useNavigate();

  const book = useRef();
  const [isMusicPlaying, setIsMusicPlaying] = useState(true); // 음악 상태 관리
  const [isAudioMuted, setIsAudioMuted] = useState(false); // 음성 상태 관리
  const [isSlideshowActive, setIsSlideshowActive] = useState(false); // 슬라이드쇼 모드
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0); // 현재 재생 중인 비디오 인덱스

  const [cards, setCards] = useState(initialCards); // 상태로 cards 관리

  // 동적으로 카드가 추가될 경우 상태를 업데이트
  useEffect(() => {
    setCards(initialCards);
  }, [initialCards]);

  // 특정 페이지로 이동 (초기 진입 및 상태 변경 시)
  useEffect(() => {
    if (pageId && book.current?.pageFlip) {
      const targetIndex = parseInt(pageId, 10) * 2; // pageId를 카드의 id로 계산
      if (targetIndex >= 0 && targetIndex < cards.length * 2) {
        setTimeout(() => {
          book.current?.pageFlip()?.flip(targetIndex + 1); // 계산된 targetIndex로 페이지 이동
        }, 10);
      }
    }
  }, [pageId, cards]); // cards 변경 시에도 이동 로직 재실행

  // 비디오 변경 핸들러 (슬라이드쇼)
  useEffect(() => {
    let videoTimer;
    if (isSlideshowActive) {
      videoTimer = setTimeout(() => {
        setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % cards.length);
      }, 5000); // 5초마다 비디오 전환 (필요에 따라 시간 변경 가능)
    }
    return () => clearTimeout(videoTimer); // 타이머 정리
  }, [isSlideshowActive, currentVideoIndex]);

  // 슬라이드쇼 모드 토글
  const handleFrameMode = () => {
    setIsSlideshowActive(true); // 슬라이드쇼 모드 시작
  };

  const handleExitSlideshow = () => {
    setIsSlideshowActive(false); // 슬라이드쇼 모드 종료
  };

  // 버튼 클릭 핸들러
  const handleFirstPage = () => {
    console.log('첫 페이지로 이동');
    if (book.current?.pageFlip) {
      book.current.pageFlip().flip(0); // 첫 페이지로 이동
    } else {
      console.error('HTMLFlipBook이 초기화되지 않았습니다.');
    }
  };

  // 음악 켜기/끄기 토글
  const handleMusicToggle = () => {
    setIsMusicPlaying((prevState) => !prevState); // 상태 토글
    console.log(isMusicPlaying ? '음악 끄기' : '음악 켜기');
    // 실제 음악 켜기/끄기 로직 추가
  };

  // 음성 끄기/켜기 토글
  const handleAudioToggle = () => {
    setIsAudioMuted((prevState) => !prevState); // 상태 토글
    console.log(isAudioMuted ? '음성 켜기' : '음성 끄기');
    // 실제 음성 끄기/켜기 로직 추가
  };


  const handleClose = () => {
    console.log('종료 버튼 클릭');
    navigate('/'); // useNavigate로 페이지 이동
  };



  const handleFlipPrev = () => {
    if (book.current && book.current.pageFlip) {
      book.current.pageFlip().flipPrev();
    }
  };

  const handleFlipNext = () => {
    if (book.current && book.current.pageFlip) {
      book.current.pageFlip().flipNext();
    }
  };

  // 페이지 렌더링
  const renderPage = (card, pageIndex) => {
    return (
      <div className="page-content">
        {pageIndex % 2 === 0 ? ( // 짝수 페이지
          card.video ? (
            <video
              src={card.video}
              autoPlay
              loop
              muted
              className="background-video"
            />
          ) : card.image ? (
            <img
              src={card.image}
              alt={`page ${pageIndex}`}
              className="background-image"
            />
          ) : (
            <div className="background-placeholder">콘텐츠가 없습니다.</div>
          )
        ) : ( // 홀수 페이지
          card.text && (
            <div className="page-text">
              <p>{card.text}</p>
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div className="container">
      {/* HTMLFlipBook 컴포넌트 */}
      <HTMLFlipBook
        ref={book}  // ref 전달
        width={800}
        height={800}
        size="stretch"
        minWidth={400}
        maxWidth={600}
        minHeight={400}
        maxHeight={700}
        maxShadowOpacity={0.7}
        showCover={false}
        mobileScrollSupport={true}
        className="flip-book"
      >
        {cards.flatMap((card) => [
          <div className="left-page" key={`image-${card.id}`}>
            {renderPage(card, card.id * 2)}
          </div>,
          <div className="right-page" key={`text-${card.id}`}>
            {renderPage(card, card.id * 2 + 1)}
          </div>,
        ])}
      </HTMLFlipBook>

      {/* 버튼 컨테이너 */}
      <div className="button-container">
        {/* 첫 페이지 이동 버튼 */}
        <div
          className="bookmark-button left"
          onClick={handleFirstPage}
          aria-label="첫 페이지로 이동"
        >
          <img src={RewindIcon} alt="Rewind" className="icon" />
          첫 페이지로
        </div>

        <div className="right-buttons">
          {/* 음성 토글 버튼 */}
          <div
            className="bookmark-button"
            onClick={handleAudioToggle}
            aria-label={isAudioMuted ? '음성 켜기' : '음성 끄기'}
          >
            <img src={SpeakerIcon} alt="Speaker" className="icon" />
            {isAudioMuted ? '음성 켜기' : '음성 끄기'}
          </div>

          {/* 음악 토글 버튼 */}
          <div
            className="bookmark-button"
            onClick={handleMusicToggle}
            aria-label={isMusicPlaying ? '음악 끄기' : '음악 켜기'}
          >
            <img src={MusicNote} alt="Music Note" className="icon" />
            {isMusicPlaying ? '음악끄기' : '음악켜기'}
          </div>

          {/* 액자 형식 재생 버튼 */}
          <div
            className="bookmark-button"
            onClick={handleFrameMode}
            aria-label="액자 형식으로 재생"
          >
            <img src={PhotoIcon} alt="Photo" className="icon" />
            액자형식으로 재생
          </div>
        </div>
      </div>

      {/* 닫기 버튼 */}
      <Link to="/gallary" className="close-button">
        <span>닫기</span>
      </Link>
    </div>
  );

};

export default Frame2;
