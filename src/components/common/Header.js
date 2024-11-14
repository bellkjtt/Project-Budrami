// components/common/Header.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // useLocation을 추가합니다
import biglifelogo from '../../images/life2.png';
import './Header.css';
import userIcon from '../../images/Male User.png'; // Adjust the path to where the image is located

function Header() {
  const location = useLocation();

  return (
    <header className="header">
      <Link to="/">
        <img src={biglifelogo} alt="Gemini Logo" className="header-logo" />
      </Link>
      {/* 특정 경로에서만 아이콘 표시 */}
      {location.pathname === '/chat' && (
        <img src={userIcon} alt="User Icon" className="user-icon" />
      )}
    </header>
  );
}

export default Header;
