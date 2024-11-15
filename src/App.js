import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { TransitionGroup, Transition } from 'react-transition-group';
import ChatPage from './pages/ChatPage';
import HomePage from './pages/HomePage';
import GallaryPage from './pages/GallaryPage';
import Header from './components/common/Header';
import Frame2 from './components/Frame2/Frame2';

const TIMEOUT = 300;

const getTransitionStyles = (status) => ({
  entering: {
    position: 'absolute',
    opacity: 0,
    transform: 'translateX(50px)',
    backgroundColor: '#DFD9CE',
  },
  entered: {
    transition: `opacity ${TIMEOUT}ms ease-in-out, transform ${TIMEOUT}ms ease-in-out`,
    opacity: 1,
    transform: 'translateX(0)',
    backgroundColor: '#DFD9CE',
  },
  exiting: {
    transition: `opacity ${TIMEOUT}ms ease-in-out, transform ${TIMEOUT}ms ease-in-out`,
    opacity: 0,
    transform: 'translateX(-50px)',
    backgroundColor: '#DFD9CE',
  },
  exited: {
    opacity: 0,
    transform: 'translateX(50px)',
    backgroundColor: '#DFD9CE',
  },
}[status]);

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#DFD9CE' }}>
      <TransitionGroup className="relative w-full h-full">
        <Transition key={location.pathname} timeout={TIMEOUT}>
          {(status) => (
            <div
              style={{
                ...getTransitionStyles(status),
              }}
              className="w-full h-full absolute top-0 left-0"
            >
              <Routes location={location}>
                <Route path="/" element={<HomePage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/gallary" element={<GallaryPage />} />
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
      <div style={{ 
        position: 'relative', 
        overflow: 'hidden', 
        width: '100%', 
        height: '100vh',
        backgroundColor: '#DFD9CE'  // 최상위 컨테이너에도 배경색 지정
      }}>
        <Header />
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

export default App;