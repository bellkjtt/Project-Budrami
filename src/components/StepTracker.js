// StepTracker.js
import React, { useState } from 'react';
import './StepTracker.css';

const stepsData = ["유년기", "청년기", "중년기", "장년기"];

const StepTracker = () => {
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <div className="step-tracker">
      {stepsData.map((step, index) => (
        <Step 
          key={index} 
          label={step} 
          isCompleted={index < currentStep} 
          isActive={index === currentStep} 
        />
      ))}
    </div>
  );
};

const Step = ({ label, isCompleted, isActive }) => (
  <div className="step">
    <div className={`circle ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
      {isCompleted ? '✔' : <div className="inner-circle" />}
    </div>
    <span className="label">{label}</span>
  </div>
);

export default StepTracker;
