import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import '../styles/GallaryPage.css';
import { useNavigate } from 'react-router-dom';

const GallaryPage = ({ cards }) => {
  console.log('Cards received in GallaryPage:', cards);  // cards 배열 확인용
  const navigate = useNavigate();

  return (
    <div className="back-container">
      <div className="background-image" />
      <div className="content-container">
      <div className="cards-grid">
          {cards && cards.length > 0 ? (
            cards.map((card) => (
          <motion.div
            key={card.id}
                className="card-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: card.id * 0.2 }}
                whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/book/${card.id}`)} // 각 카드 클릭 시 ID 전달
          >
                <div className="card-image">
                <img
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover"
                />
                </div>
            <div className="card-content">
                  <h2>{card.title}</h2>
                  <p>"{card.subtitle}"</p>
            </div>
                <div className="hover-overlay" />
          </motion.div>
            ))
          ) : (
            <p>카드가 없습니다.</p>  // 카드가 없을 경우 메시지 표시
          )}
        </div>
      </div>
    </div>
  );
};

export default GallaryPage;
