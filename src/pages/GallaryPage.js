// 'use client'
import image1 from '../images/image 1.png';
import image2 from '../images/image 2.png';
import image3 from '../images/image 3.png';


import { motion } from "framer-motion";
import "../styles/GallaryPage.css";

export default function Component() {
  const cards = [
    {
      id: 1,
      title: "공과 사랑으로 일군 인생",
      subtitle: "꿈을 내려놓고, 거침을 줍다.",
      image: image1
    },
    {
      id: 2,
      title: "감사 속에 피어난 아름다움",
      subtitle: "이렇게 새로운 시작",
      image: image2
    },
    {
      id: 3,
      title: "가족과 함께한 단단한 시간들",
      subtitle: "위기 속에서 하나 된 것",
      image: image3
    }
  ];

  return (
    <div className="back-container">
      <div className="background-image" />
      
      <div className="content-container">
        {/* <div>
          <h1>자서전 아카이브</h1>
          <p>소중한 순간들을 기록하세요</p>
        </div> */}

        <div className="cards-grid">
          {cards.map((card) => (
            <motion.div
              key={card.id}
              className="card-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: card.id * 0.2 }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
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
          ))}
        </div>
      </div>
    </div>
  );
}
