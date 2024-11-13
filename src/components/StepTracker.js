import React, { useState, useEffect } from 'react';
import './StepTracker.css';

const stepsData = ["유년기", "청년기", "중년기", "장년기"];

const StepTracker = ({ setCurrentStep, currentStep }) => {
  useEffect(() => {
    console.log("Updated currentStep:", currentStep);
  }, [currentStep]);

  const handleStepClick = (index) => {
    setCurrentStep(index);
  };

  return (
    <div className="step-tracker">
      {stepsData.map((step, index) => (
        <Step 
          key={index} 
          label={step} 
          isCompleted={index < currentStep} 
          isActive={index === currentStep} 
          onClick={() => handleStepClick(index)}
        />
      ))}

      {/* Step 값이 4 이상일 때만 자서전 생성 버튼 렌더링 */}
      {currentStep >= 4 && (
        <button className="autobiography-button">나의 이야기 만들기</button>
      )}
    </div>
  );
};

const Step = ({ label, isCompleted, isActive, onClick }) => (
  <div className="step" onClick={onClick}>
    <div className={`circle ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
      {isCompleted ? '✔' : <div className="inner-circle" />}
    </div>
    <span className="label">{label}</span>
  </div>
);

export default StepTracker;
