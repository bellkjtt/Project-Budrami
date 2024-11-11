// components/common/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import biglifelogo from '../../images/life2.png';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <Link to="/">
        <img src={biglifelogo} alt="Gemini Logo" className="header-logo" />
      </Link>
    </header>
  );
}

export default Header;
