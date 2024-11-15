// src/components/Frame2/Frame2.js
import React, { useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import './Frame2.css';

// 이미지 및 비디오 파일 import
import ArrowLeft from '../../images/arrow_left.png';
import ArrowRight from '../../images/arrow_right.png';
import CloseIcon from '../../images/close.png';
import MusicNote from '../../images/music_note.png';
import PhotoIcon from '../../images/photo.png';
import RewindIcon from '../../images/rewind.png';
import MainVideo from '../../videos/main-video.mp4'; // 첫 번째 페이지 비디오
import Video2 from '../../videos/main-video2.mp4'; // 두 번째 페이지 비디오
import Video3 from '../../videos/main-video3.mp4'; // 세 번째 페이지 비디오
import BookPage from '../../images/bookpage.png'; // 배경 이미지

const Frame2 = () => {
  const book = useRef();

  // 버튼 클릭 핸들러
  const handleFirstPage = () => {
    console.log('첫 페이지로 이동');
    book.current.pageFlip().flip(0);
  };

  const handleMusicToggle = () => {
    console.log('음악 켜기/끄기');
    // 실제 로직 추가
  };

  const handleFrameMode = () => {
    console.log('액자 형식으로 재생');
    // 실제 로직 추가
  };

  const handleClose = () => {
    console.log('종료 버튼 클릭');
    window.location.href = '/'; // 예시: 홈 페이지로 이동
  };

  return (
    <div className="container">
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
            onClick={handleMusicToggle}
            aria-label="음악 끄기"
          >
            <img src={MusicNote} alt="Music Note" className="icon" />
            음악끄기
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
        width={600}
        height={800}
        size="stretch"
        minWidth={315}
        maxWidth={1000}
        minHeight={420}
        maxHeight={1350}
        maxShadowOpacity={0.5}
        showCover={false}
        mobileScrollSupport={true}
        className="flip-book"
        ref={book}
        style={{ backgroundImage: `url(${BookPage})` }} // 배경 이미지 적용
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
            <div className="title">덕수궁 돌담길에서 시작된 인연</div>
            <div className="quote">“한 걸음 한 걸음, 인연은 운명처럼 찾아온다.”</div>
          </div>
        </div>

        {/* 페이지 2: 오른쪽 페이지 - 텍스트 */}
        <div className="page">
          <div className="right-page">
            <p>
              그날은 가을이었고, 덕수궁 돌담길에 노랗게 물든 은행나무가 가득했어요.
              그와 그녀는 처음 만났지만, 오래된 친구처럼 자연스럽게 이야기를 나눴어요.
              길을 걸으며 서로의 꿈과 어린 시절 이야기를 나누던 그 순간,
              이 사람과의 만남이 운명처럼 느껴졌죠.
              돌담길 끝에서 그녀가 미소 지으며 손을 내밀었을 때,
              그는 마음속에 깊은 울림을 느꼈습니다.
            </p>
          </div>
        </div>

        {/* 페이지 3: 왼쪽 페이지 - 애니메이션 및 제목 */}
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
            <div className="title">새로운 이야기의 시작</div>
            <div className="quote">“모든 끝은 새로운 시작을 의미한다.”</div>
          </div>
        </div>

        {/* 페이지 4: 오른쪽 페이지 - 텍스트 */}
        <div className="page">
          <div className="right-page">
            <p>
              시간이 흘러 그들은 다시 그 길을 찾았습니다.
              낙엽이 진 자리에는 새로운 싹이 돋아났고,
              그들은 서로의 손을 잡고 새로운 미래를 꿈꾸기 시작했어요.
              이 길은 이제 그들만의 특별한 장소가 되었고,
              앞으로도 함께 걸어갈 약속의 길이 되었습니다.
            </p>
          </div>
        </div>

        {/* 페이지 5: 왼쪽 페이지 - 애니메이션 및 제목 */}
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
            <div className="title">영원한 약속</div>
            <div className="quote">“함께라면 두렵지 않아.”</div>
          </div>
        </div>

        {/* 페이지 6: 오른쪽 페이지 - 텍스트 */}
        <div className="page">
          <div className="right-page">
            <p>
              계절이 바뀌어도 그들의 사랑은 변치 않았습니다.
              매년 그 길을 걸으며 처음 만났던 순간을 되새기곤 했죠.
              서로에게 가장 소중한 사람이 되어,
              이제는 하나의 이야기를 함께 써 내려가고 있습니다.
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
        <div className="brand">LIFERARY</div>
      </div>
    </div>
  );
};

export default Frame2;