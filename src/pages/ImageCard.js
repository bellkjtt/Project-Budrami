import React, { useState } from 'react';

const ImageCard = ({ imageUrl, title, subtitle }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setError(true);
    console.error(`Failed to load image: ${imageUrl}`);
  };

  return (
    <div className="card-image relative">
      {!imageLoaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      {error && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-500">이미지를 불러올 수 없습니다</span>
        </div>
      )}
      <img
        src={imageUrl}
        alt={title}
        className={`object-cover w-full h-full transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};

export default ImageCard;