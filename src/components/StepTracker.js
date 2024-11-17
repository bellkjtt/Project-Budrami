import React, { useState, useEffect } from 'react';
import './StepTracker.css';
import AutobiographyButton from './AutobiographyButton';

const stepsData = ["유년기", "청년기", "중년기", "장년기"];

const StepTracker = ({ setCurrentStep, currentStep }) => {
  // useEffect(() => {
  //   // console.log("Updated currentStep:", currentStep);
  // }, [currentStep]);

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
