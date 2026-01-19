// Enhanced Hero Section Animations
class HeroAnimations {
  constructor() {
    this.init();
  }

  init() {
    this.initTypewriter();
    this.initParticleSystem();
    this.initAirflowLines();
    this.initEnhancedButtons();
    this.initNavigationEffects();
  }

  initTypewriter() {
    const typewriterText = document.querySelector('.typewriter-text');
    if (!typewriterText) return;

    const originalText = typewriterText.textContent;
    typewriterText.textContent = '';
    typewriterText.style.width = '0';
    typewriterText.style.borderRight = '3px solid #007AFF';

    let charIndex = 0;
    const typeSpeed = 80;
    const pauseAtEnd = 2000;

    const typeNextChar = () => {
      if (charIndex < originalText.length) {
        typewriterText.textContent += originalText.charAt(charIndex);
        charIndex++;
        setTimeout(typeNextChar, typeSpeed);
      } else {
        // Start blinking cursor
        this.startBlinkingCursor(typewriterText);
      }
    };

    // Start typing after a delay
    setTimeout(typeNextChar, 800);
  }

  startBlinkingCursor(element) {
    let isVisible = true;
    setInterval(() => {
      element.style.borderRightColor = isVisible ? 'transparent' : '#007AFF';
      isVisible = !isVisible;
    }, 750);
  }

  initParticleSystem() {
    const particles = document.querySelectorAll('.particle');
    
    particles.forEach((particle, index) => {
      // Add random movement
      setInterval(() => {
        const randomX = Math.random() * 20 - 10;
        const randomY = Math.random() * 20 - 10;
        particle.style.transform = `translate(${randomX}px, ${randomY}px)`;
      }, 3000 + (index * 500));
    });
  }

  initAirflowLines() {
    const lines = document.querySelectorAll('.airflow-line');
    
    lines.forEach((line, index) => {
      // Add hover pause effect
      line.addEventListener('mouseenter', () => {
        line.style.animationPlayState = 'paused';
        line.style.opacity = '1';
      });

      line.addEventListener('mouseleave', () => {
        line.style.animationPlayState = 'running';
      });

      // Add click effect
      line.addEventListener('click', () => {
        line.style.transform = 'scale(1.5)';
        line.style.opacity = '0.8';
        setTimeout(() => {
          line.style.transform = 'scale(1)';
          line.style.opacity = '1';
        }, 300);
      });
    });
  }

  initEnhancedButtons() {
    const enhancedButtons = document.querySelectorAll('.enhanced-btn');
    
    enhancedButtons.forEach(button => {
      // Add ripple effect
      button.addEventListener('click', (e) => {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          left: ${x}px;
          top: ${y}px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          transform: scale(0);
          animation: ripple 0.6s linear;
          pointer-events: none;
        `;
        
        button.appendChild(ripple);
        
        setTimeout(() => {
          ripple.remove();
        }, 600);
      });

      // Enhanced hover effects
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-3px) scale(1.05)';
        button.style.boxShadow = '0 10px 30px rgba(0, 122, 255, 0.4)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0) scale(1)';
        button.style.boxShadow = '0 4px 15px rgba(0, 122, 255, 0.3)';
      });
    });
  }

  initNavigationEffects() {
    const navLinks = document.querySelectorAll('.navbar-links a');
    const contactBtn = document.querySelector('.contact-btn');
    
    // Navigation links effects
    navLinks.forEach(link => {
      // Keep default styles; CSS handles hover states
    });

    // Contact button effects
    if (contactBtn) {
      // Keep default styles; CSS handles hover states
    }
  }
}

// Add ripple animation to CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HeroAnimations();
});

// Export for use in other files
window.HeroAnimations = HeroAnimations;