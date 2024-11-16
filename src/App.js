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
    { id: 1, title: "공과 사랑으로 일군 인생", subtitle: "꿈을 내려놓고, 거침을 줍다.", image: image1 },
    { id: 2, title: "감사 속에 피어난 아름다움", subtitle: "이렇게 새로운 시작", image: image2 },
    { id: 3, title: "가족과 함께한 단단한 시간들", subtitle: "위기 속에서 하나 된 것", image: image3 }
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
                <Route path="/book" element={<Frame2 />} />
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
