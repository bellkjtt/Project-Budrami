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
import SpeakerIcon from '../../images/speaker.png';

const Frame2 = ({ cards: initialCards }) => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const book = useRef();
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [flipKey, setFlipKey] = useState(0);
  const [cards, setCards] = useState(initialCards);
  const ws = useRef(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    setCards(initialCards);
  }, [initialCards]);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:3002');

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
    };

    ws.current.onmessage = async (event) => {
      try {
        if (event.data instanceof Blob) {
          const audioBlob = event.data;
          const audioUrl = URL.createObjectURL(audioBlob);
          
          if (audioPlayer) {
            audioPlayer.pause();
            URL.revokeObjectURL(audioPlayer.src);
          }

          const newAudioPlayer = new Audio(audioUrl);
          setAudioPlayer(newAudioPlayer);
          await newAudioPlayer.play();
          setAudioLoading(false);
        }
      } catch (error) {
        console.error('Error playing audio:', error);
        setAudioLoading(false);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setAudioLoading(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (audioPlayer) {
        audioPlayer.pause();
        URL.revokeObjectURL(audioPlayer.src);
      }
    };
  }, []);

  useEffect(() => {
    if (pageId && book.current?.pageFlip) {
      const targetIndex = parseInt(pageId, 10) * 2;
      if (targetIndex >= 0 && targetIndex < cards.length * 2) {
        setTimeout(() => {
          book.current?.pageFlip()?.flip(targetIndex);
        }, 10);
      }
    }
  }, [pageId, cards]);

  useEffect(() => {
    const handleResize = () => {
      if (book.current?.pageFlip) {
        book.current.pageFlip().update();
      }
    };
  
    setTimeout(handleResize, 400);
  
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [pageId, cards]);

  useEffect(() => {
    let videoTimer;
    if (isSlideshowActive) {
      videoTimer = setTimeout(() => {
        setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % cards.length);
      }, 5000);
    }
    return () => clearTimeout(videoTimer);
  }, [isSlideshowActive, currentVideoIndex]);

  const handlePageChange = (e) => {
    setCurrentPage(e.data);
    if (!isAudioMuted) {
      const currentCardIndex = Math.floor(e.data / 2);
      const isRightPage = e.data % 2 === 1;
      if (isRightPage && cards[currentCardIndex]?.text) {
        playTTS(cards[currentCardIndex].text);
      }
    }
  };

  const handleFrameMode = () => {
    setIsSlideshowActive(true);
  };

  const handleExitSlideshow = () => {
    setIsSlideshowActive(false);
  };

  const handleFirstPage = () => {
    if (book.current?.pageFlip) {
      book.current.pageFlip().flip(0);
    }
  };

  const handleMusicToggle = () => {
    setIsMusicPlaying((prevState) => !prevState);
  };

  const handleAudioToggle = () => {
    const newMutedState = !isAudioMuted;
    setIsAudioMuted(newMutedState);
    console.log('Audio muted state changed to:', newMutedState);
    
    if (!newMutedState) {  // 음성을 켤 때
      const currentCardIndex = Math.floor(currentPage / 2);
      const isRightPage = currentPage % 2 === 0;
      
      console.log('Current page:', currentPage);
      console.log('Current card index:', currentCardIndex);
      console.log('Is right page:', isRightPage);
      console.log('Current card text:', cards[currentCardIndex]?.text);
      
      if (isRightPage && cards[currentCardIndex]?.text) {
        setAudioLoading(true);  // 여기로 이동
        playTTS(cards[currentCardIndex].text);
      }
    } else {
      if (audioPlayer) {
        audioPlayer.pause();
        URL.revokeObjectURL(audioPlayer.src);
        setAudioPlayer(null);
      }
      setAudioLoading(false);
    }
  };

  const playTTS = async (text) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket connection status:', ws.current?.readyState);
      setAudioLoading(false);
      return;
    }

    console.log('Sending TTS request for text:', text);
    try {
      ws.current.send(JSON.stringify({ text }));
    } catch (error) {
      console.error('Error sending TTS request:', error);
      setAudioLoading(false);
    }
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

  const renderPage = (card, pageIndex) => {
    return (
      <div className="page-content">
        {pageIndex % 2 === 0 ? (
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
        ) : (
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
      <HTMLFlipBook
        key={flipKey}
        ref={book}
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
        onFlip={handlePageChange}
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

      <div className="button-container">
        <div
          className="bookmark-button left"
          onClick={handleFirstPage}
          aria-label="첫 페이지로 이동"
        >
          <img src={RewindIcon} alt="Rewind" className="icon" />
          첫 페이지로
        </div>

        <div className="right-buttons">
          <div
            className={`bookmark-button ${audioLoading ? 'loading' : ''}`}
            onClick={handleAudioToggle}
            aria-label={isAudioMuted ? '음성 켜기' : '음성 끄기'}
          >
            <img src={SpeakerIcon} alt="Speaker" className="icon" />
            {isAudioMuted ? '음성 켜기' : (audioLoading ? '로딩 중...' : '음성 끄기')}
          </div>

          <div
            className="bookmark-button"
            onClick={handleMusicToggle}
            aria-label={isMusicPlaying ? '음악 끄기' : '음악 켜기'}
          >
            <img src={MusicNote} alt="Music Note" className="icon" />
            {isMusicPlaying ? '음악끄기' : '음악켜기'}
          </div>

          <div
            className="bookmark-button"
            onClick={handleFrameMode}
            aria-label="액자 형식으로 재생"
          >
            <img src={PhotoIcon} alt="Photo" className="icon" />
            큰 글씨로 보기
          </div>
        </div>
      </div>

      <Link to="/gallary" className="close-button">
        <span>닫기</span>
      </Link>
    </div>
  );
};

export default Frame2;