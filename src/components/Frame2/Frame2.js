// src/components/Frame2/Frame2.js
import React, { useRef, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import './Frame2.css';
import { useNavigate } from 'react-router-dom';


// 이미지 및 비디오 파일 import
import ArrowLeft from '../../images/arrow_left.png';
import ArrowRight from '../../images/arrow_right.png';
import CloseIcon from '../../images/close.png';
import MusicNote from '../../images/music_note.png';
import PhotoIcon from '../../images/photo.png';
import RewindIcon from '../../images/rewind.png';
import Logo from '../../images/logo.png';
import SpeakerIcon from '../../images/speaker.png'; // 스피커 아이콘 추가
import MainVideo from '../../videos/video1.mp4'; // 첫 번째 페이지 비디오
import Video2 from '../../videos/video2.mp4'; // 두 번째 페이지 비디오
import Video3 from '../../videos/video3.mp4'; // 세 번째 페이지 비디오
import Video4 from '../../videos/main-video4.mp4'; // 세 번째 페이지 비디오


const videos = [MainVideo, Video2, Video3, Video4]; // 비디오 리스트

const Frame2 = () => {
  const book = useRef();
  const [isMusicPlaying, setIsMusicPlaying] = useState(true); // 음악 상태 관리
  const [isAudioMuted, setIsAudioMuted] = useState(false); // 음성 상태 관리
  const [isSlideshowActive, setIsSlideshowActive] = useState(false); // 슬라이드쇼 모드
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0); // 현재 재생 중인 비디오 인덱스
  const navigate = useNavigate(); // useNavigate 훅 사용

  // 비디오 변경 핸들러 (슬라이드쇼)
  useEffect(() => {
    let videoTimer;
    if (isSlideshowActive) {
      videoTimer = setTimeout(() => {
        setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length);
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
    book.current.pageFlip().flip(0);
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

  return (
    <div className="container">
       {/* 슬라이드쇼 모드가 활성화되지 않은 경우: 기본 플립북 UI */}
       {!isSlideshowActive ? (
        <>
      {/* 버튼 컨테이너 */}
      <div className="button-container">
        {/* 왼쪽에 "첫 페이지로" 버튼 */}
        <div
          className="bookmark-button left"
          onClick={handleFirstPage}
          aria-label="첫 페이지로 이동"
        >
          <img src={RewindIcon} alt="Rewind" className="icon" />
          첫 페이지로
        </div>

        {/* 오른쪽에 "음악끄기"와 "액자형식으로 재생" 버튼을 가로로 정렬 */}
        <div className="right-buttons">
        <div
            className="bookmark-button"
            onClick={handleAudioToggle}
            aria-label={isAudioMuted ? '음성 켜기' : '음성 끄기'}
          >
            <img src={SpeakerIcon} alt="Speaker" className="icon" />
            {isAudioMuted ? '음성 켜기' : '음성 끄기'}
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
            액자형식으로 재생
          </div>
        </div>

        {/* "종료" 버튼 */}
        <div
          className="close-button"
          onClick={handleClose}
          aria-label="종료"
        >
          <img src={CloseIcon} alt="Close" className="close-icon" />
          <span>종료</span>
        </div>
      </div>

      {/* 플립북 컴포넌트 */}
      <HTMLFlipBook
        ref={book}  // ref 전달
        width={600}
        height={800}
        size="stretch"
        minWidth={315}
        maxWidth={1000}
        minHeight={420}
        maxHeight={1350}
        maxShadowOpacity={0.7}
        showCover={false}
        mobileScrollSupport={true}
        className="flip-book"
      >
        
        {/* 페이지 1: 왼쪽 페이지 - 애니메이션 및 제목 */}
        <div className="page">
          <div className="left-page">
                <video
                    src={MainVideo}
                    className="background-video"
                    autoPlay
                    loop
                    muted
                    playsInline
                    width="80%"
                    height="auto"
                />
            <div className="title">전쟁 속에서 피어난 희망</div>
            <div className="quote">“가족과 이웃, 나를 지켜준 힘”</div>
          </div>
        </div>

        {/* 페이지 2: 오른쪽 페이지 - 텍스트 */}
        <div className="page">
          <div className="right-page">
            <p>
            전쟁의 기억은 아직도 생생하다. 다섯 살에 들었던 포성, 마을 사람들이 도망치던 모습, 그 모든 것이 마치 세상이 끝나는 것 같았다. 피난 생활은 힘들었지만, 가족과 함께여서 위안을 얻었다. 전쟁 후 고향에 돌아왔을 때, 마을은 많이 변했지만 우리는 다시 시작했다. 친구들과 개울가에서 물장구를 치며 웃고 떠들던 기억은 내 어린 시절의 가장 행복한 순간이었다. 아버지의 헌신, 어머니의 사랑 덕분에 우리는 어려운 시간을 이겨낼 수 있었고, 그 사랑이 지금까지 나를 지켜주고 있다.
            </p>
          </div>
        </div>

        {/* 페이지 3: 왼쪽 페이지 - 애니메이션 및 제목 */}
        <div className="page">
          <div className="left-page">
            <video
                src={Video2}
                className="background-video"
                autoPlay
                loop
                muted
                playsInline
                width="80%"
                height="auto"
            />
            <div className="title">꿈과 사랑으로 일군 인생</div>
            <div className="quote">“붓을 내려놓고, 가정을 품다.”</div>
          </div>
        </div>

        {/* 페이지 4: 오른쪽 페이지 - 텍스트 */}
        <div className="page">
          <div className="right-page">
            <p>
            젊은 시절, 나는 미술 선생님이 되고 싶었다. 공원에서 혼자 풍경을 그리는 걸 좋아했고, 친구들에게 그림을 가르치는 것도 즐거웠다. 그러나 가정 형편 때문에 꿈을 이루지 못하고 결혼 후 남편과 아이들을 돌보는 것이 내 삶의 중심이 되었다. 경제적 어려움 속에서도 가족은 서로를 도우며 어려움을 극복했고, 그 과정에서 더 단단해졌다. 함께한 모든 순간이 내게는 소중한 보물이다.
            </p>
          </div>
        </div>

        {/* 페이지 5: 왼쪽 페이지 - 애니메이션 및 제목 */}
        <div className="page">
          <div className="left-page">
                <video
                    src={Video3}
                    className="background-video"
                    autoPlay
                    loop
                    muted
                    playsInline
                    width="80%"
                    height="auto"
                />
            <div className="title">가족과 함께한 단단한 시간들</div>
            <div className="quote">“위기 속에서 하나 된 가족”</div>
          </div>
        </div>

        {/* 페이지 6: 오른쪽 페이지 - 텍스트 */}
        <div className="page">
          <div className="right-page">
            <p>
            중년이 되면서 내 삶의 중심은 가족이었다. 아이들이 자라나는 모습을 지켜보며 “너희는 무엇이든 할 수 있어”라는 말로 자신감을 키워주었다. 큰아들의 대학 합격은 지금도 가슴 벅찬 기억이다. 남편의 사업 실패로 어려움을 겪었지만, 가족이 힘을 합쳐 극복해냈다. 중년이 되며 삶에 여유를 찾고, 부모님을 더 잘 돌보지 못한 아쉬움이 남지만, 가족을 위해 헌신했던 시간이 나를 더 강하게 만들었다.
            </p>
          </div>
        </div>
                {/* 페이지 5: 왼쪽 페이지 - 애니메이션 및 제목 */}
                <div className="page">
          <div className="left-page">
                <video
                    src={Video4}
                    className="background-video"
                    autoPlay
                    loop
                    muted
                    playsInline
                    width="80%"
                    height="auto"
                />
            <div className="title">감사 속에 피어난 아름다움</div>
            <div className="quote">“이별과 새로운 시작”</div>
          </div>
        </div>

        {/* 페이지 6: 오른쪽 페이지 - 텍스트 */}
        <div className="page">
          <div className="right-page">
            <p>
            노년이 된 지금, 나는 산책을 하며 꽃꽂이를 배우며 여유를 즐긴다. 하고 싶은 것을 할 수 있는 자유가 기쁘지만, 건강이 걱정되기도 한다. 오랜 친구가 세상을 떠났을 때 마음이 아팠지만, 남은 친구들과 더 돈독해졌다. 여전히 건강하게 손주들의 결혼을 보고 싶고, 여행을 꿈꾸며 남은 시간을 감사하게 살고 있다. 내 인생을 한 마디로 표현하면 ‘사랑으로 일군 풍요로운 삶’이다.
            </p>
          </div>
        </div>
      </HTMLFlipBook>

      {/* 네비게이션 아이콘 */}
      <div className="navigation">
        <img
          src={ArrowLeft}
          alt="Previous"
          className="nav-icon left"
          onClick={() => book.current.pageFlip().flipPrev()}
        />
        <img
          src={ArrowRight}
          alt="Next"
          className="nav-icon right"
          onClick={() => book.current.pageFlip().flipNext()}
        />
      </div>

      {/* 하단 푸터 */}
      <div className="footer">
        <img src={Logo} alt="Logo" className="brand-logo" />
      </div>
      </>
      ) : (
        // 슬라이드쇼 모드
        <div className="slideshow-container">
          <video
            src={videos[currentVideoIndex]}
            className="slideshow-video"
            autoPlay
            muted={isAudioMuted}
            controls={false}
            onEnded={() =>
              setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length)
            }
            style={{ width: '100%', height: '100%' }}
          />
          <button className="exit-button" onClick={handleExitSlideshow}>
            종료
          </button>
        </div>
      )}
    </div>
  );
};

export default Frame2;