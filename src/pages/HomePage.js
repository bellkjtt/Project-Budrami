// HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/common/Header';
import '../styles/HomePage.css';
import RightBookImage from '../images/Book_3D_right.png';
import LeftBookImage from '../images/Book_3D_left.png';

const HomePage = () => {
  return (
    <div className="home-container">
      {/* <Header /> */}
      <main className="home-main">
        <div className="books-section">
          {/* 오른쪽 책 */}
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M13.75 6.75L19.25 12L13.75 17.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 12H4.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>

          {/* 타이틀 섹션 */}
          <div className="title-section">
            <h1 className="main-title">나의 인생, 나만의 도서관</h1>
            <h2 className="sub-title">라이프러리</h2>
          </div>

          {/* 왼쪽 책 */}
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M13.75 6.75L19.25 12L13.75 17.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 12H4.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;