import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';
import RightBookImage from '../images/Book_3D_right.png';
import LeftBookImage from '../images/Book_3D_left.png';

const Arrow = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -1 24 24">
  <path d="M14 5l7 7-7 7M21 12H3" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="4" 
        stroke-linecap="round" 
        stroke-linejoin="round"/>
</svg>
);






const HomePage = () => {
  return (
    <div className="home-container">
      <main className="home-main">
        <div className="books-section">
          <div className="right-book-container">
            <img
              src={RightBookImage}
              alt="오른쪽 책"
              className="right-book"
            />
            <div className="book-overlay-right">
              <h3 className="book-title"></h3>
              <Link to="/chat" className="book-link">
                <span>남기러 가기</span>
                <Arrow />
              </Link>
            </div>
          </div>

          <div className="title-section">
            <h1 className="main-title">나의 인생, 나만의 도서관</h1>
            <h2 className="sub-title">라이프러리</h2>
          </div>

          <div className="left-book-container">
            <img
              src={LeftBookImage}
              alt="왼쪽 책"
              className="left-book"
            />
            <div className="book-overlay-left">
              <h3 className="book-title"></h3>
              <Link to="/chat" className="book-link">
                <span>읽으러 가기</span>
                <Arrow />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;