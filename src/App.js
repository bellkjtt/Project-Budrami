import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { TransitionGroup, Transition } from 'react-transition-group';
import ChatPage from './pages/ChatPage';
import HomePage from './pages/HomePage';
import GallaryPage from './pages/GallaryPage';
import Header from './components/common/Header';
import Frame2 from './components/Frame2/Frame2';
import image1 from './images/image 1.png';
import image2 from './images/image 2.png';
import image3 from './images/image 3.png';
import Video1 from './videos/video2.mp4';
import Video3 from './videos/video3.mp4';
import Video2 from './videos/main-video4.mp4';

const TIMEOUT = 300;

const getTransitionStyles = (status) => ({
  entering: { position: 'absolute', opacity: 0, transform: 'translateX(50px)', backgroundColor: '#DFD9CE' },
  entered: { transition: `opacity ${TIMEOUT}ms ease-in-out, transform ${TIMEOUT}ms ease-in-out`, opacity: 1, transform: 'translateX(0)', backgroundColor: '#DFD9CE' },
  exiting: { transition: `opacity ${TIMEOUT}ms ease-in-out, transform ${TIMEOUT}ms ease-in-out`, opacity: 0, transform: 'translateX(-50px)', backgroundColor: '#DFD9CE' },
  exited: { opacity: 0, transform: 'translateX(50px)', backgroundColor: '#DFD9CE' },
}[status]);

function AnimatedRoutes() {
  const location = useLocation();
  
  // 상태 추가: 카드 데이터 관리
  const [cards, setCards] = useState([
    { id: 0, title: "공과 사랑으로 일군 인생", subtitle: "꿈을 내려놓고, 거침을 줍다.", image: image1, video:Video1, text:" 젊은 시절, 나는 미술 선생님이 되고 싶었다. 공원에서 혼자 풍경을 그리는 걸 좋아했고, 친구들에게 그림을 가르치는 것도 즐거웠다. 그러나 가정 형편 때문에 꿈을 이루지 못하고 결혼 후 남편과 아이들을 돌보는 것이 내 삶의 중심이 되었다. 경제적 어려움 속에서도 가족은 서로를 도우며 어려움을 극복했고, 그 과정에서 더 단단해졌다. 함께한 모든 순간이 내게는 소중한 보물이다." },
    { id: 1, title: "감사 속에 피어난 아름다움", subtitle: "이렇게 새로운 시작", image: image2, video:Video2, text:"중년이 되면서 내 삶의 중심은 가족이었다. 아이들이 자라나는 모습을 지켜보며 “너희는 무엇이든 할 수 있어”라는 말로 자신감을 키워주었다. 큰아들의 대학 합격은 지금도 가슴 벅찬 기억이다. 남편의 사업 실패로 어려움을 겪었지만, 가족이 힘을 합쳐 극복해냈다. 중년이 되며 삶에 여유를 찾고, 부모님을 더 잘 돌보지 못한 아쉬움이 남지만, 가족을 위해 헌신했던 시간이 나를 더 강하게 만들었다." },
    { id: 2, title: "가족과 함께한 단단한 시간들", subtitle: "위기 속에서 하나 된 것", image: image3, video:Video3, text:"노년이 된 지금, 나는 산책을 하며 꽃꽂이를 배우며 여유를 즐긴다. 하고 싶은 것을 할 수 있는 자유가 기쁘지만, 건강이 걱정되기도 한다. 오랜 친구가 세상을 떠났을 때 마음이 아팠지만, 남은 친구들과 더 돈독해졌다. 여전히 건강하게 손주들의 결혼을 보고 싶고, 여행을 꿈꾸며 남은 시간을 감사하게 살고 있다. 내 인생을 한 마디로 표현하면 ‘사랑으로 일군 풍요로운 삶’이다." }
  ]);

  // 새 카드 추가 함수
  const addCard = (newCard) => {
    setCards((prevCards) => [...prevCards, newCard]);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#DFD9CE' }}>
      <TransitionGroup className="relative w-full h-full">
        <Transition key={location.pathname} timeout={TIMEOUT}>
          {(status) => (
            <div style={{ ...getTransitionStyles(status) }} className="w-full h-full absolute top-0 left-0">
              <Routes location={location}>
                <Route path="/" element={<HomePage />} />
                <Route path="/chat" element={<ChatPage onAddCard={addCard} />} />
                <Route path="/gallary" element={<GallaryPage cards={cards} />} />
                <Route path="/book/:pageId" element={<Frame2 cards={cards} />} />
              </Routes>
            </div>
          )}
        </Transition>
      </TransitionGroup>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100vh', backgroundColor: '#DFD9CE' }}>
        <Header />
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

export default App;
