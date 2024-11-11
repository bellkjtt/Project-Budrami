// src/utils/audioUtils.js

export function animateWaveform(waveform, isAnimating) {
    waveform.innerHTML = '';
    if (isAnimating) {
      for (let i = 0; i < 20; i++) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", i * 5 + 2.5);
        circle.setAttribute("cy", 15);
        circle.setAttribute("r", 1.5);
        circle.style.fill = "#4CAF50";
        waveform.appendChild(circle);
      }
      animateDots(waveform);
    }
  }
  
  function animateDots(waveform) {
    const dots = waveform.querySelectorAll('circle');
    dots.forEach((dot, index) => {
      const delay = index * 50;
      const duration = 500;
      dot.animate([
        { cy: 15 },
        { cy: 5 + Math.random() * 20 },
        { cy: 15 }
      ], {
        duration: duration,
        delay: delay,
        iterations: Infinity
      });
    });
  }
  
  export function createStars(container) {
    for (let i = 0; i < 100; i++) {
      const star = document.createElement('div');
      star.classList.add('star');
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 5}s`;
      container.appendChild(star);
    }
  }
  
  export function speakResponse(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    speechSynthesis.speak(utterance);
  }