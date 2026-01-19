// Animation and Interaction Handlers

document.addEventListener('DOMContentLoaded', () => {
  runPageIntro();
  // Initialize animations
  initializeAnimations();
  
  // Initialize counters
  initializeCounters();
  
  // Initialize partner logos carousel
  initializePartnerLogosCarousel();
  
  // Initialize product slider
  initializeProductSlider();
  
  // Initialize project showcase
  initializeProjectShowcase();
  
  // Initialize smooth product carousel
  initializeSmoothProductCarousel();
  
  // Custom cursor removed for accessibility
  
  // Initialize category buttons
  initializeCategoryButtons();
  
  // Initialize enhanced button interactions
  initializeEnhancedButtons();

  // Mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.getElementById('primary-navigation');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Initialize project category filter (Projects page)
  initializeProjectCategoryFilter();
  // No banner glow when floating strip

  // Initialize journey carousel (About page)
initializeJourneyCarousel();

  // Normalize primary nav items across pages
  updatePrimaryNavigationLinks();

  // Home enhancements
  initializeHomepageEffects();
  initializeParallaxLayers();
  // Removed duplicate initializeCounters() call
  // Removed hero 3D fan per request
  initializeFloatingNavbar();
  
  // Initialize HVAC slideshow
  console.log('Initializing HVAC slideshow...');
  initializeHVACSlideshow();
});
// Hide-on-scroll-down, show-on-scroll-up for floating navbar
function initializeFloatingNavbar() {
  const nav = document.querySelector('.unified-navbar');
  if (!nav) return;
  let lastY = window.pageYOffset || document.documentElement.scrollTop;
  let ticking = false;
  const onScroll = () => {
    const y = window.pageYOffset || document.documentElement.scrollTop;
    const direction = y > lastY ? 'down' : 'up';
    document.body.classList.toggle('scrolling-down', direction === 'down' && y > 40);
    document.body.classList.toggle('scrolling-up', direction === 'up' || y <= 40);
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();
}
// Page Intro: white overlay, components fall into place
function runPageIntro() {
  try {
    const overlay = document.querySelector('.page-intro-overlay');
    // Avoid replaying intro on back/forward navigation within the same session
    if (sessionStorage.getItem('introPlayed') === '1') {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      return;
    }
    document.body.classList.add('intro-prep');
    // Play shortly after paint
    setTimeout(() => {
      document.body.classList.add('intro-play');
      document.body.classList.remove('intro-prep');
      // Mark as played after animation completes
      setTimeout(() => {
        sessionStorage.setItem('introPlayed', '1');
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 1200);
    }, 120);
  } catch (_) {
    // Fail silently
  }
}
// Minimal Three.js hero background model (rotating wireframe torus)
function initializeHero3D() {
  const container = document.querySelector('.hero-3d-container');
  if (!container || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.z = 5.5;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // Build a more realistic axial fan (hub + curved blades + guard rings)
  const fan = new THREE.Group();
  fan.scale.set(1.15, 1.15, 1.15);

  const hubMaterial = new THREE.MeshStandardMaterial({ color: 0x1b283f, metalness: 0.8, roughness: 0.25 });
  const bladeMaterial = new THREE.MeshStandardMaterial({ color: 0x2f4e8c, metalness: 0.75, roughness: 0.3 });
  bladeMaterial.side = THREE.DoubleSide;
  const guardMaterial = new THREE.MeshStandardMaterial({ color: 0x8aa7ff, metalness: 0.85, roughness: 0.18 });

  // Hub (domed)
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.42, 48, 32), hubMaterial);
  fan.add(hub);

  // Curved blades using extruded shape
  const makeBlade = () => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.30, 0.08, 0.8, 0.02);
    shape.quadraticCurveTo(1.2, -0.05, 1.6, -0.14);
    shape.quadraticCurveTo(1.35, 0.16, 0.75, 0.26);
    shape.quadraticCurveTo(0.30, 0.20, 0, 0.10);
    const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false, steps: 1 });
    geom.center();
    return new THREE.Mesh(geom, bladeMaterial);
  };

  const bladeCount = 7;
  for (let i = 0; i < bladeCount; i++) {
    const blade = makeBlade();
    blade.rotation.y = Math.PI / 10; // pitch
    blade.position.x = 0.8;
    const wrap = new THREE.Group();
    wrap.add(blade);
    wrap.rotation.z = (i / bladeCount) * Math.PI * 2;
    fan.add(wrap);
  }

  // Guard rings removed to avoid any linear artifacts
  // Spokes removed to avoid visual bar artifacts across the hero

  scene.add(fan);

  const light1 = new THREE.PointLight(0x4facfe, 1.2, 100);
  light1.position.set(5, 5, 8);
  scene.add(light1);
  const light2 = new THREE.PointLight(0xf093fb, 1.0, 100);
  light2.position.set(-6, -4, 6);
  scene.add(light2);
  const ambient = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambient);

  let rafId = null;
  // Subtle mouse parallax for fan
  let targetRotX = 0;
  let targetRotY = 0;
  const onMouseMove = (e) => {
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    targetRotX = y * 0.08; // tilt up/down
    targetRotY = x * 0.08; // tilt left/right
  };
  window.addEventListener('mousemove', onMouseMove, { passive: true });

  const animate = () => {
    rafId = requestAnimationFrame(animate);
    fan.rotation.z += 0.006; // slow, realistic spin
    // ease toward mouse parallax
    fan.rotation.x += ((0.07 + targetRotX) - fan.rotation.x) * 0.06;
    fan.rotation.y += (targetRotY - fan.rotation.y) * 0.06;
    renderer.render(scene, camera);
  };
  animate();

  const onResize = () => {
    const { clientWidth: w, clientHeight: h } = container;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);
}

// Initialize enhanced button interactions
function initializeEnhancedButtons() {
  // Enhanced button interactions
  const enhancedButtons = document.querySelectorAll('.enhanced-btn');
  enhancedButtons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px) scale(1.05)';
      button.style.boxShadow = '0 8px 25px rgba(0, 122, 255, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0) scale(1)';
      button.style.boxShadow = '0 4px 15px rgba(0, 122, 255, 0.3)';
    });
    
    button.addEventListener('mousedown', () => {
      button.style.transform = 'translateY(0) scale(1.02)';
    });
    
    button.addEventListener('mouseup', () => {
      button.style.transform = 'translateY(-2px) scale(1.05)';
    });
  });
  
  // Navigation link hover effects
  const navLinksHover = document.querySelectorAll('.navbar-links a');
  navLinksHover.forEach(link => {
    link.addEventListener('mouseenter', () => {
      link.style.color = '#007AFF';
      link.style.transform = 'translateY(-1px)';
    });
    
    link.addEventListener('mouseleave', () => {
      link.style.color = '#333';
      link.style.transform = 'translateY(0)';
    });
  });
  
  // Contact button enhanced interactions
  // Let CSS handle contact button hover effects
}

// Homepage-only animations and effects
function initializeHomepageEffects() {
  if (!document.body.classList.contains('homepage')) return;

  // Keep hero title static (no shimmer). Fade-in handled by existing .fade-in observer.

  // Inject floating orbs layer into hero
  const heroSection = document.querySelector('.hero-section');
  if (heroSection && !heroSection.querySelector('.hero-orbs')) {
    const orbs = document.createElement('div');
    orbs.className = 'hero-orbs';
    orbs.innerHTML = '<div class="orb orb-a"></div><div class="orb orb-b"></div><div class="orb orb-c"></div>';
    heroSection.appendChild(orbs);
  }

  // Reveal-up observer
  const revealTargets = document.querySelectorAll('.featured-projects-section .project-card, .news-section .news-card, .category-nav-box, .categories-grid-k .category-card-k');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -5% 0px' });
  revealTargets.forEach(el => { el.classList.add('reveal-up'); revealObserver.observe(el); });

  // Parallax tilt on hover for cards
  document.querySelectorAll('.project-card, .news-card, .category-nav-box').forEach(card => {
    card.classList.add('tilt-hover');
    let rafId = null;
    const onMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const rotateX = (y * -6).toFixed(2);
      const rotateY = (x * 6).toFixed(2);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
      });
    };
    const reset = () => { card.style.transform = 'perspective(700px) rotateX(0) rotateY(0)'; };
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', reset);
  });

  // Scroll progress bar
  if (!document.getElementById('scroll-progress')) {
    const bar = document.createElement('div');
    bar.id = 'scroll-progress';
    document.body.appendChild(bar);
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight);
      bar.style.width = `${Math.max(0, Math.min(1, scrolled)) * 100}%`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}

// Simple parallax for elements with data-parallax
function initializeParallaxLayers() {
  const layers = document.querySelectorAll('[data-parallax]');
  if (!layers.length) return;

  // Motion parallax
  const onScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    layers.forEach(layer => {
      const speed = parseFloat(layer.getAttribute('data-speed') || '0.1');
      const translateY = Math.round(scrollTop * speed);
      layer.style.transform = `translate3d(0, ${translateY}px, 0)`;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Section in-view color reveal
  const sections = new Set();
  layers.forEach(layer => sections.add(layer.closest('section')));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const sec = entry.target;
      if (entry.isIntersecting) {
        sec.classList.add('in-view');
      } else {
        sec.classList.remove('in-view');
      }
    });
  }, { threshold: 0.25 });
  sections.forEach(sec => sec && observer.observe(sec));

  // Also observe common sections even if they don't have a parallax layer
  document.querySelectorAll('section.featured-projects-section, section.product-categories, section.cta').forEach(sec => observer.observe(sec));
}

// Show all navigation items including the current page
function updatePrimaryNavigationLinks() {
  const navList = document.getElementById('primary-navigation');
  if (!navList) return;

  // Define site nav items
  const navItems = [
    { key: 'home', label: 'Home', href: 'index.html' },
    { key: 'about', label: 'About', href: 'about.html' },
    { key: 'products', label: 'Products', href: 'products.html' },
    { key: 'projects', label: 'Projects', href: 'projects.html' },
    { key: 'careers', label: 'Careers', href: 'careers.html' },
    { key: 'news', label: 'News', href: 'news.html' },
    { key: 'contact', label: 'Contact', href: 'contact.html' },
  ];

  // Show all navigation items (no filtering)
  const itemsHtml = navItems.map(item => `<li><a href="${item.href}">${item.label}</a></li>`).join('');
  navList.innerHTML = itemsHtml;
}

// Initialize all animations
function initializeAnimations() {
  // Fade in animations on scroll
  const observerOptions = {
    threshold: 0.2,
    rootMargin: "50px"
  };

  const fadeInElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in');
  
  const fadeInObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeInObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  fadeInElements.forEach(element => {
    fadeInObserver.observe(element);
  });

  // No parallax effect - static hero section
  const heroSection = document.querySelector('.hero-section');
  const heroContent = document.querySelector('.hero-content-wrapper');
  const heroImage = document.querySelector('.hero-image');
  
  if (heroSection && heroContent && heroImage) {
    // Remove transform styles to ensure static positioning
    heroContent.style.transform = 'none';
    heroImage.style.transform = 'none';
  }

  // Smooth hover effects for buttons and cards
  const interactiveElements = document.querySelectorAll('.btn, .counter-item, .news-card, .product-item');
  
  interactiveElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
      element.style.transform = 'translateY(-5px) scale(1.02)';
      element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.transform = 'translateY(0) scale(1)';
  });
});
}

// Journey Carousel (About page)
function initializeJourneyCarousel() {
  const carousel = document.querySelector('.journey-carousel-section');
  const track = document.querySelector('.journey-carousel-track');
  const viewport = document.querySelector('.journey-carousel-viewport');
  const prevBtn = document.querySelector('.carousel-nav-prev');
  const nextBtn = document.querySelector('.carousel-nav-next');
  const dotsContainer = document.querySelector('.carousel-dots');
  
  if (!carousel || !track) return;

  let currentIndex = 0;
  let isAnimating = false;
  let startX = 0;
  let currentX = 0;
  let isDragging = false;
  let autoScrollInterval = null;
  let isAutoScrolling = true;
  
  const cards = Array.from(track.querySelectorAll('.journey-card'));
  const totalCards = cards.length;
  
  // Calculate cards per view based on screen size
  const getCardsPerView = () => {
    const width = window.innerWidth;
    if (width >= 1200) return 4;
    if (width >= 900) return 3;
    if (width >= 768) return 2;
    return 1;
  };
  
  let cardsPerView = getCardsPerView();
  let maxIndex = Math.max(0, totalCards - cardsPerView);
  
  // Create dots
  const createDots = () => {
    if (!dotsContainer) return;
    
    dotsContainer.innerHTML = '';
    const totalDots = Math.ceil(totalCards / cardsPerView);
    
    for (let i = 0; i < totalDots; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => goToSlide(i * cardsPerView));
      dotsContainer.appendChild(dot);
    }
  };
  
  // Update dots
  const updateDots = () => {
    const dots = dotsContainer?.querySelectorAll('.carousel-dot');
    if (!dots) return;
    
    const activeDotIndex = Math.floor(currentIndex / cardsPerView);
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === activeDotIndex);
    });
  };
  
  // Calculate card width and gap
  const getCardWidth = () => {
    return 400; // Fixed card width
  };
  
  // Update carousel position
  const updateCarousel = (animate = true) => {
    if (!track) return;
    
    const cardWidth = getCardWidth();
    const gap = 32;
    const translateX = -(currentIndex * (cardWidth + gap));
    
    if (animate) {
      track.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    } else {
      track.style.transition = 'none';
    }
    
    track.style.transform = `translateX(${translateX}px)`;
    
    // Update navigation buttons
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= maxIndex;
    
    updateDots();
  };
  
  // Go to specific slide
  const goToSlide = (index, animate = true) => {
    if (isAnimating) return;
    
    currentIndex = Math.max(0, Math.min(index, maxIndex));
    updateCarousel(animate);
    
    // Trigger animation for cards entering viewport
    const startCard = currentIndex;
    const endCard = Math.min(currentIndex + cardsPerView, totalCards);
    
    cards.forEach((card, index) => {
      if (index >= startCard && index < endCard) {
        card.classList.add('visible');
      }
    });
  };
  
  // Next slide
  const nextSlide = () => {
    if (currentIndex < maxIndex) {
      goToSlide(currentIndex + 1);
    } else {
      // Loop back to the beginning
      goToSlide(0);
    }
  };
  
  // Previous slide
  const prevSlide = () => {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    } else {
      // Loop to the end
      goToSlide(maxIndex);
    }
  };
  
  // Auto-scroll functionality
  const startAutoScroll = () => {
    if (autoScrollInterval) return;
    
    autoScrollInterval = setInterval(() => {
      if (!isDragging && isAutoScrolling) {
        nextSlide();
      }
    }, 3000); // Auto-scroll every 3 seconds
  };
  
  const stopAutoScroll = () => {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  };
  
  const pauseAutoScroll = () => {
    isAutoScrolling = false;
  };
  
  const resumeAutoScroll = () => {
    isAutoScrolling = true;
  };
  
  // Touch/Swipe handling
  const handleTouchStart = (e) => {
    startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
    isDragging = true;
    track.style.transition = 'none';
    pauseAutoScroll();
  };
  
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
    const diff = currentX - startX;
    const cardWidth = getCardWidth();
    const gap = 32;
    const currentTranslate = -(currentIndex * (cardWidth + gap));
    
    track.style.transform = `translateX(${currentTranslate + diff}px)`;
  };
  
  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    isDragging = false;
    const diff = currentX - startX;
    const cardWidth = getCardWidth();
    const threshold = cardWidth * 0.3;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    } else {
      updateCarousel();
    }
    
    // Resume auto-scroll after a short delay
    setTimeout(() => {
      resumeAutoScroll();
    }, 1000);
  };
  
  // Event listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      pauseAutoScroll();
      setTimeout(() => resumeAutoScroll(), 2000);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      pauseAutoScroll();
      setTimeout(() => resumeAutoScroll(), 2000);
    });
  }
  
  // Touch events
  if (viewport) {
    viewport.addEventListener('touchstart', handleTouchStart, { passive: false });
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
    viewport.addEventListener('touchend', handleTouchEnd);
    
    // Mouse events for desktop
    viewport.addEventListener('mousedown', handleTouchStart);
    viewport.addEventListener('mousemove', handleTouchMove);
    viewport.addEventListener('mouseup', handleTouchEnd);
    viewport.addEventListener('mouseleave', handleTouchEnd);
    
    // Pause auto-scroll on hover
    viewport.addEventListener('mouseenter', pauseAutoScroll);
    viewport.addEventListener('mouseleave', resumeAutoScroll);
  }
  
  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide();
    }
  };
  
  carousel.addEventListener('keydown', handleKeyDown);
  
  // Intersection Observer for card animations
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  
  cards.forEach(card => revealObserver.observe(card));
  
  // Handle resize
  const handleResize = () => {
    const newCardsPerView = getCardsPerView();
    if (newCardsPerView !== cardsPerView) {
      cardsPerView = newCardsPerView;
      maxIndex = Math.max(0, totalCards - cardsPerView);
      createDots();
      
      // Adjust current index if it's now out of bounds
      if (currentIndex > maxIndex) {
        currentIndex = maxIndex;
      }
      
      updateCarousel(false);
    }
  };
  
  // Initialize
  createDots();
  goToSlide(0, false);
  
  // Make first few cards visible initially
  const initialCards = Math.min(cardsPerView, totalCards);
  for (let i = 0; i < initialCards; i++) {
    cards[i]?.classList.add('visible');
  }
  
  // Start auto-scroll
  startAutoScroll();
  
  // Pause auto-scroll when carousel is not in view
  const carouselObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        resumeAutoScroll();
      } else {
        pauseAutoScroll();
      }
    });
  }, { threshold: 0.3 });
  
  carouselObserver.observe(carousel);
  
  window.addEventListener('resize', handleResize, { passive: true });
}

// Initialize counters with animation
function initializeCounters() {
  const numNodes = document.querySelectorAll('.counter-number, .diag-band .num');
  const speed = 200;

  const animateCounter = (node) => {
    const targetAttr = node.getAttribute('data-target');
    const target = targetAttr ? parseInt(targetAttr.replace(/\D/g, ''), 10) : 0;
    let count = 0;
    
    const updateCount = () => {
      const increment = target / speed;
      
      if (count < target) {
        count = Math.ceil(count + increment);
        node.innerText = count.toLocaleString();
        setTimeout(updateCount, 1);
      } else {
        node.innerText = target.toLocaleString();
      }
    };

    updateCount();
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  numNodes.forEach(node => counterObserver.observe(node));
}

// Initialize product slider
function initializeProductSlider() {
  // Only initialize slider if navigation elements are present (not on products.html)
  const slider = document.querySelector('.products-grid');
  const slides = document.querySelectorAll('.product-item');
  const dots = document.querySelectorAll('.nav-dot');
  const prevBtn = document.querySelector('.nav-arrow.prev');
  const nextBtn = document.querySelector('.nav-arrow.next');
  
  if (!slider || !slides.length) return;
  
  // Check if we're on the products page - if so, don't initialize slider
  if (window.location.pathname.includes('products.html')) {
    // Ensure the grid stays in its default position
    slider.style.transform = 'none';
    return;
  }
  
  // Only proceed with slider if navigation elements exist
  if (!dots.length && !prevBtn && !nextBtn) {
    slider.style.transform = 'none';
    return;
  }

  let currentSlide = 0;
  const slidesPerView = window.innerWidth > 1200 ? 4 : window.innerWidth > 900 ? 3 : window.innerWidth > 600 ? 2 : 1;
  const totalSlides = Math.ceil(slides.length / slidesPerView);

  const updateSlider = () => {
    const offset = -currentSlide * (100 / slidesPerView);
    slider.style.transform = `translateX(${offset}%)`;
    
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentSlide);
    });
  };

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
      updateSlider();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentSlide = (currentSlide + 1) % totalSlides;
      updateSlider();
    });
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      currentSlide = index;
      updateSlider();
    });
  });

  // Auto-advance slider only if navigation elements exist
  if (dots.length || prevBtn || nextBtn) {
    setInterval(() => {
      currentSlide = (currentSlide + 1) % totalSlides;
      updateSlider();
    }, 5000);
  }
}

// Initialize project showcase
function initializeProjectShowcase() {
  const slides = document.querySelectorAll('.project-slide');
  if (!slides.length) return;

  let currentSlide = 0;
  const totalSlides = slides.length;

  const showSlide = (index) => {
    slides.forEach(slide => slide.classList.remove('active'));
    slides[index].classList.add('active');
  };

  const nextSlide = () => {
    currentSlide = (currentSlide + 1) % totalSlides;
    showSlide(currentSlide);
  };

  // Auto-advance slides
  setInterval(nextSlide, 5000);

  // Add click navigation
  slides.forEach((slide, index) => {
    slide.addEventListener('click', () => {
      currentSlide = index;
      showSlide(currentSlide);
    });
  });
}

// Smooth scroll function
function smoothScrollTo(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

// Initialize partner logos carousel
function initializePartnerLogosCarousel() {
  // Use unified selector from index.html
  new Swiper('.partners-swiper', {
    slidesPerView: 'auto',
    spaceBetween: 24,
    loop: true,
    loopAdditionalSlides: 10,
    centeredSlides: false,
    freeMode: {
      enabled: true,
      momentum: false,
    },
    autoplay: {
      delay: 0, // continuous
      disableOnInteraction: false,
      pauseOnMouseEnter: false,
    },
    speed: 8000, // slow, smooth marquee
    allowTouchMove: true,
    grabCursor: true,
  });
}

// Smooth Product Carousel with Professional Fade Transitions
function initializeSmoothProductCarousel() {
  const images = document.querySelectorAll('.product-showcase-img');
  
  if (images.length === 0) {
    return;
  }
  
  let currentIndex = 0;
  
  // Ensure first image is visible by default
  images.forEach((img, index) => {
    img.style.animation = 'none';
    if (index === 0) {
      img.classList.add('active');
    } else {
      img.classList.remove('active');
    }
  });
  
  
  function fadeToNext() {
    const currentImage = images[currentIndex];
    const nextIndex = (currentIndex + 1) % images.length;
    const nextImage = images[nextIndex];
    
    
    // Remove active class from current image
    currentImage.classList.remove('active');
    
    // After fade out completes, add active class to next image
    setTimeout(() => {
      nextImage.classList.add('active');
      currentIndex = nextIndex;
    }, 350); // Half of the 700ms transition duration
  }
  
  // Start the carousel with 3-second intervals
  setInterval(fadeToNext, 3000);
}

// Projects page: filter grid by product category buttons with pagination
function initializeProjectCategoryFilter() {
  const buttons = document.querySelectorAll('.proj-category-button');
  const cards = document.querySelectorAll('.project-filter-grid .project-card');
  const paginationInfo = document.querySelector('.pagination-info');
  const paginationControls = document.querySelector('.pagination-controls');
  const currentRange = document.querySelector('.current-range');
  const totalProjects = document.querySelector('.total-projects');
  const pageNumbers = document.querySelector('.page-numbers');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');
  
  if (!buttons.length || !cards.length) return;

  let currentPage = 1;
  let currentCategory = 'all';
  const cardsPerPage = 9;

  const setActive = (target) => {
    buttons.forEach(btn => btn.setAttribute('aria-pressed', 'false'));
    target.setAttribute('aria-pressed', 'true');
  };

  const getVisibleCards = () => {
    return Array.from(cards).filter(card => {
      if (currentCategory === 'all') return true;
      const categories = (card.getAttribute('data-category') || '').toLowerCase();
      return categories.includes(currentCategory);
    });
  };

  const updatePagination = () => {
    const visibleCards = getVisibleCards();
    const totalPages = Math.ceil(visibleCards.length / cardsPerPage);
    
    // Show/hide pagination based on number of cards
    if (visibleCards.length > cardsPerPage) {
      paginationInfo.style.display = 'block';
      paginationControls.style.display = 'flex';
    } else {
      paginationInfo.style.display = 'none';
      paginationControls.style.display = 'none';
    }

    // Update pagination info
    const start = (currentPage - 1) * cardsPerPage + 1;
    const end = Math.min(currentPage * cardsPerPage, visibleCards.length);
    currentRange.textContent = `${start}-${end}`;
    totalProjects.textContent = visibleCards.length;

    // Generate page numbers
    pageNumbers.innerHTML = '';
    
    if (totalPages <= 7) {
      // Show all page numbers if 7 or fewer pages
      for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => goToPage(i));
        pageNumbers.appendChild(pageBtn);
      }
    } else {
      // Show first page, last page, current page, and neighbors
      const pages = new Set();
      
      // Always show first page
      pages.add(1);
      
      // Show pages around current page
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.add(i);
      }
      
      // Always show last page
      pages.add(totalPages);
      
      // Convert to array and sort
      const pageArray = Array.from(pages).sort((a, b) => a - b);
      
      // Build page numbers with ellipsis
      for (let i = 0; i < pageArray.length; i++) {
        if (i > 0 && pageArray[i] - pageArray[i-1] > 1) {
          const ellipsis = document.createElement('span');
          ellipsis.className = 'page-number ellipsis';
          ellipsis.textContent = '...';
          pageNumbers.appendChild(ellipsis);
        }
        
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number ${pageArray[i] === currentPage ? 'active' : ''}`;
        pageBtn.textContent = pageArray[i];
        pageBtn.addEventListener('click', () => goToPage(pageArray[i]));
        pageNumbers.appendChild(pageBtn);
      }
    }

    // Update prev/next buttons
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
  };

  const goToPage = (page) => {
    currentPage = page;
    showCurrentPage();
    updatePagination();
  };

  const showCurrentPage = () => {
    const visibleCards = getVisibleCards();
    const start = (currentPage - 1) * cardsPerPage;
    const end = start + cardsPerPage;

    cards.forEach((card, index) => {
      const isVisible = visibleCards.includes(card);
      const isInCurrentPage = visibleCards.indexOf(card) >= start && visibleCards.indexOf(card) < end;
      
      if (isVisible && isInCurrentPage) {
        card.style.display = '';
        card.classList.add('fade-in');
        requestAnimationFrame(() => card.classList.add('visible'));
      } else {
        card.style.display = 'none';
        card.classList.remove('fade-in', 'visible');
      }
    });
  };

  const filterBy = (category) => {
    currentCategory = category;
    currentPage = 1; // Reset to first page when filtering
    
    const grid = document.querySelector('.project-filter-grid');
    if (!grid) return;
    
    grid.classList.remove('animating-in');
    grid.classList.add('animating-out');
    
    setTimeout(() => {
      showCurrentPage();
      updatePagination();
      grid.classList.remove('animating-out');
      grid.classList.add('animating-in');
    }, 160);
  };

  // Event listeners
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      setActive(btn);
      filterBy(btn.getAttribute('data-category'));
    });
  });

  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  });

  nextBtn.addEventListener('click', () => {
    const visibleCards = getVisibleCards();
    const totalPages = Math.ceil(visibleCards.length / cardsPerPage);
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  });

  // Initialize
  showCurrentPage();
  updatePagination();
}

// Pointer-follow glow for the project category bar
function initializeCategoryBarPointer() {
  const bar = document.querySelector('.project-category-bar');
  if (!bar) return;
  const update = (e) => {
    const rect = bar.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    bar.style.setProperty('--mouse-x', x + '%');
    bar.style.setProperty('--mouse-y', y + '%');
  };
  bar.addEventListener('mousemove', update, { passive: true });
  bar.addEventListener('mouseleave', () => {
    bar.style.setProperty('--mouse-x', '50%');
    bar.style.setProperty('--mouse-y', '50%');
  });
}
// Initialize Custom Cursor
function initializeCustomCursor() {
  // Create cursor element
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  document.body.appendChild(cursor);
  
  // Create cursor trails
  const trails = [];
  const trailCount = 3;
  
  for (let i = 0; i < trailCount; i++) {
    const trail = document.createElement('div');
    trail.className = 'custom-cursor-trail';
    trail.style.opacity = (1 - (i * 0.3)).toString();
    document.body.appendChild(trail);
    trails.push(trail);
  }
  
  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;
  
  // Track mouse movement
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  
  // Smooth cursor animation
  function animateCursor() {
    // Smooth follow effect
    cursorX += (mouseX - cursorX) * 0.1;
    cursorY += (mouseY - cursorY) * 0.1;
    
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    
    // Animate trails with delay
    trails.forEach((trail, index) => {
      const delay = (index + 1) * 0.02;
      const trailX = cursorX + (mouseX - cursorX) * (1 - delay);
      const trailY = cursorY + (mouseY - cursorY) * (1 - delay);
      
      trail.style.left = trailX + 'px';
      trail.style.top = trailY + 'px';
    });
    
    requestAnimationFrame(animateCursor);
  }
  
  animateCursor();
  
  // Handle hover interactions
  const titleSelectors = 'h1, h2, h3, h4, h5, h6, .hero-title, .products-main-title, .partners-title-main, .partners-title-accent';
  const linkSelectors = 'a, button, .btn, .nav-arrow, .nav-dot';
  
  // Title hover effects
  document.querySelectorAll(titleSelectors).forEach(title => {
    title.addEventListener('mouseenter', () => {
      cursor.classList.add('hover-title');
      title.style.cursor = 'none';
    });
    
    title.addEventListener('mouseleave', () => {
      cursor.classList.remove('hover-title');
    });
  });
  
  // Link hover effects
  document.querySelectorAll(linkSelectors).forEach(link => {
    link.addEventListener('mouseenter', () => {
      cursor.classList.add('hover-link');
      link.style.cursor = 'none';
    });
    
    link.addEventListener('mouseleave', () => {
      cursor.classList.remove('hover-link');
    });
  });
  
  // Hide cursor when mouse leaves window
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    trails.forEach(trail => trail.style.opacity = '0');
  });
  
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
    trails.forEach((trail, index) => {
      trail.style.opacity = (1 - (index * 0.3)).toString();
    });
  });
  
  // Special interactions for specific elements
  const specialElements = document.querySelectorAll('.counter-item, .product-item, .swiper-slide');
  specialElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
      cursor.style.background = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    });
    
    element.addEventListener('mouseleave', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      cursor.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    });
  });
}

// Enhanced title interaction effects
function enhanceTextInteractions() {
  const titles = document.querySelectorAll('h1, h2, h3, h4, h5, h6, .hero-title, .products-main-title, .partners-title-main, .partners-title-accent');
  
  titles.forEach(title => {
    title.addEventListener('mouseenter', () => {
      // Add subtle scale and glow effect
      title.style.filter = 'drop-shadow(0 0 20px rgba(102, 126, 234, 0.4))';
      title.style.transform = 'translateY(-2px) scale(1.02)';
    });
    
    title.addEventListener('mouseleave', () => {
      title.style.filter = 'none';
      title.style.transform = 'translateY(0) scale(1)';
    });
  });
}

// Initialize enhanced interactions
document.addEventListener('DOMContentLoaded', () => {
  enhanceTextInteractions();
});

// Add smooth scroll to all anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = anchor.getAttribute('href').slice(1);
    smoothScrollTo(targetId);
  });
});

// Initialize Category Buttons
function initializeCategoryButtons() {
  const categoryButtons = document.querySelectorAll('.category-button');
  
  if (categoryButtons.length === 0) return;
  
  // Initialize the first grid (All category) with animations
  const initialGrid = document.querySelector('.product-grid.active');
  if (initialGrid) {
    const initialItems = initialGrid.querySelectorAll('.product-showcase-item');
    initialItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('animate-in');
        setTimeout(() => {
          item.classList.add('visible');
        }, 600);
      }, index * 120);
    });
  }
  
  categoryButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all buttons and reset styling
      categoryButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = '#f8f9fa';
        btn.style.color = '#333';
        btn.style.border = '2px solid #dee2e6';
      });
      
      // Add active class to clicked button and apply active styling
      button.classList.add('active');
      button.style.background = '#007AFF';
      button.style.color = '#ffffff';
      button.style.border = '2px solid #007AFF';
      
      // Get the selected category
      const selectedCategory = button.getAttribute('data-category');
      
      // Animate out current product cards first
      const currentActiveGrid = document.querySelector('.product-grid.active');
      if (currentActiveGrid) {
        const currentItems = currentActiveGrid.querySelectorAll('.product-showcase-item');
        
        // Animate out current cards with staggered timing
        currentItems.forEach((item, index) => {
          setTimeout(() => {
            item.classList.add('animate-out');
            item.classList.remove('animate-in', 'visible');
          }, index * 50);
        });
        
        // Add fade-out class to current grid
        currentActiveGrid.classList.add('fade-out');
        currentActiveGrid.classList.remove('active');
      }
      
      // Show the selected category grid with enhanced animation
      setTimeout(() => {
        const targetGrid = document.querySelector(`[data-category="${selectedCategory}"].product-grid`);
        if (targetGrid) {
          // Hide all grids and clean up classes
          const allProductGrids = document.querySelectorAll('.product-grid');
          allProductGrids.forEach(grid => {
            grid.style.display = 'none';
            grid.classList.remove('active', 'fade-out', 'fade-in');
            
            // Reset all cards in other grids
            const items = grid.querySelectorAll('.product-showcase-item');
            items.forEach(item => {
              item.classList.remove('animate-in', 'animate-out', 'visible');
            });
          });
          
          // Show and animate the target grid
          targetGrid.style.display = 'block';
          targetGrid.offsetHeight; // Force reflow
          targetGrid.classList.add('active', 'fade-in');
          
          // Animate in new product items with smooth staggered timing
          const productItems = targetGrid.querySelectorAll('.product-showcase-item');
          productItems.forEach((item, index) => {
            // Reset the item state
            item.classList.remove('animate-out', 'visible');
            
            setTimeout(() => {
              item.classList.add('animate-in');
              
              // Add visible class after animation completes
              setTimeout(() => {
                item.classList.add('visible');
              }, 600);
            }, index * 120); // Staggered delay of 120ms between cards
          });
        }
      }, currentActiveGrid ? 200 : 0); // Wait for fade out if there's an active grid
      
      // Log the selection for debugging
      console.log('Selected category:', selectedCategory);
      
      // Trigger a custom event that can be listened to elsewhere
      const categoryChangeEvent = new CustomEvent('categoryChange', {
        detail: { category: selectedCategory }
      });
      document.dispatchEvent(categoryChangeEvent);
      
      // Optional: Update URL without page reload for better UX
      if (selectedCategory !== 'all') {
        window.history.pushState(null, '', `#category-${selectedCategory}`);
      } else {
        window.history.pushState(null, '', window.location.pathname);
      }
    });
  });
  
  // Handle browser back/forward buttons
  window.addEventListener('popstate', () => {
    const hash = window.location.hash;
    let targetCategory = 'all';
    
    if (hash.startsWith('#category-')) {
      targetCategory = hash.replace('#category-', '');
    }
    
    const targetButton = document.querySelector(`[data-category="${targetCategory}"]`);
    
    if (targetButton) {
      // Update button states
      categoryButtons.forEach(btn => btn.classList.remove('active'));
      targetButton.classList.add('active');
      
      // Update product display with animations
      const currentActiveGrid = document.querySelector('.product-grid.active');
      if (currentActiveGrid) {
        const currentItems = currentActiveGrid.querySelectorAll('.product-showcase-item');
        
        // Animate out current cards
        currentItems.forEach((item, index) => {
          setTimeout(() => {
            item.classList.add('animate-out');
            item.classList.remove('animate-in', 'visible');
          }, index * 50);
        });
        
        currentActiveGrid.classList.add('fade-out');
        currentActiveGrid.classList.remove('active');
      }
      
      setTimeout(() => {
        const targetGrid = document.querySelector(`[data-category="${targetCategory}"].product-grid`);
        if (targetGrid) {
          // Clean up all grids
          const allProductGrids = document.querySelectorAll('.product-grid');
          allProductGrids.forEach(grid => {
            grid.style.display = 'none';
            grid.classList.remove('active', 'fade-out', 'fade-in');
            
            const items = grid.querySelectorAll('.product-showcase-item');
            items.forEach(item => {
              item.classList.remove('animate-in', 'animate-out', 'visible');
            });
          });
          
          // Show and animate target grid
          targetGrid.style.display = 'block';
          targetGrid.offsetHeight;
          targetGrid.classList.add('active', 'fade-in');
          
          // Animate in product items
          const productItems = targetGrid.querySelectorAll('.product-showcase-item');
          productItems.forEach((item, index) => {
            item.classList.remove('animate-out', 'visible');
            
            setTimeout(() => {
              item.classList.add('animate-in');
              setTimeout(() => {
                item.classList.add('visible');
              }, 600);
            }, index * 120);
          });
        }
      }, currentActiveGrid ? 200 : 0);
    }
  });
}

// HVAC Slideshow Implementation - Smooth and Optimized
function initializeHVACSlideshow() {
  console.log('=== HVAC SLIDESHOW INITIALIZATION STARTED ===');
  
  const slideshow = document.getElementById('hvacSlideshow');
  if (!slideshow) {
    console.log('Slideshow element not found');
    return;
  }
  
  const slides = slideshow.querySelectorAll('.hvac-slide');
  const progressDots = slideshow.querySelectorAll('.progress-dot');
  
  console.log('Found slides:', slides.length);
  console.log('Found progress dots:', progressDots.length);
  
  if (slides.length === 0) {
    console.log('No slides found, aborting');
    return;
  }
  
  // Array of available background images from the indexbackground folder
  const backgroundImages = [
    'indexbackground/TIBA MANZALAWI GROU-14.jpg',
    'indexbackground/TIBA MANZALAWI GROU-10.jpg',
    'indexbackground/TIBA MANZALAWI GROU-8.jpg',
    'indexbackground/TIBA MANZALAWI GROU-6.jpg',
    'indexbackground/TIBA MANZALAWI GROUP-139.jpg',
    'indexbackground/TIBA MANZALAWI GROUP-135.jpg',
    'indexbackground/TIBA MANZALAWI GROUP-100.jpg',
    'indexbackground/TIBA MANZALAWI GROUP-99.jpg',
    'indexbackground/TIBA MANZALAWI GROUP-92.jpg',
    'indexbackground/TIBA MANZALAWI GROUP-82.jpg',
    'indexbackground/TIBA MANZALAWI GROUP-79.jpg',
    'indexbackground/TIBA MANZALAWI GROUP-80.jpg',
    'indexbackground/TIBA MANZALAWI GROUP-72.jpg',
    'indexbackground/TIBA MANZALAWI GROUP-70.jpg',
    'indexbackground/TIBA MANZALAWI GROUP-66.jpg',
    'indexbackground/TIBA MANZALAWI GROUP-67.jpg'
  ];
  
  // Shuffle images randomly
  const shuffledImages = [...backgroundImages].sort(() => Math.random() - 0.5);
  
  // Preload all images for smooth transitions
  const imagePromises = [];
  slides.forEach((slide, index) => {
    const imageUrl = shuffledImages[index % shuffledImages.length];
    const img = new Image();
    
    const promise = new Promise((resolve, reject) => {
      img.onload = () => {
        slide.style.backgroundImage = `url('${imageUrl}')`;
        slide.style.backgroundSize = 'cover';
        slide.style.backgroundPosition = 'center';
        slide.style.backgroundRepeat = 'no-repeat';
        console.log(`Slide ${index + 1} background preloaded: ${imageUrl}`);
        resolve();
      };
      img.onerror = () => {
        console.log(`Slide ${index + 1} image failed to load, using fallback`);
        // Use a subtle gradient as fallback instead of bright colors
        slide.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        resolve();
      };
    });
    
    imagePromises.push(promise);
    img.src = imageUrl;
  });
  
  let currentSlide = 0;
  let isTransitioning = false;
  
  // Wait for all images to load before starting slideshow
  Promise.all(imagePromises).then(() => {
    console.log('All slideshow images loaded, starting slideshow');
    showSlide(0);
    startAutoSlide();
  });
  
  // Smooth slide transition function
  function showSlide(index) {
    if (isTransitioning) return;
    
    console.log('Showing slide:', index);
    isTransitioning = true;
    
    // Hide all slides with smooth transition
    slides.forEach(slide => {
      slide.style.opacity = '0';
      slide.style.transform = 'scale(1.05)';
      slide.classList.remove('active');
    });
    
    // Remove active from all dots
    progressDots.forEach(dot => dot.classList.remove('active'));
    
    // Show current slide with smooth transition
    if (slides[index]) {
      setTimeout(() => {
        slides[index].style.opacity = '1';
        slides[index].style.transform = 'scale(1)';
        slides[index].classList.add('active');
        
        // Activate current dot
        if (progressDots[index]) {
          progressDots[index].classList.add('active');
        }
        
        currentSlide = index;
        isTransitioning = false;
      }, 50); // Small delay for smooth transition
    }
  }
  
  // Next slide function
  function nextSlide() {
    const nextIndex = (currentSlide + 1) % slides.length;
    showSlide(nextIndex);
  }
  
  // Auto-slide functionality
  let autoSlideInterval;
  function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 5000);
  }
  
  function stopAutoSlide() {
    if (autoSlideInterval) {
      clearInterval(autoSlideInterval);
    }
  }
  
  // Add click handlers to progress dots
  progressDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      stopAutoSlide();
      showSlide(index);
      setTimeout(startAutoSlide, 2000); // Resume after 2 seconds
    });
  });
  
  // Pause auto-slide on hover
  slideshow.addEventListener('mouseenter', stopAutoSlide);
  slideshow.addEventListener('mouseleave', startAutoSlide);
  
  // Add smooth hover effects (removed scale transforms that cause issues)
  slides.forEach((slide, index) => {
    slide.addEventListener('mouseenter', () => {
      if (slide.classList.contains('active')) {
        slide.style.filter = 'brightness(1.05)';
      }
    });
    
    slide.addEventListener('mouseleave', () => {
      if (slide.classList.contains('active')) {
        slide.style.filter = 'brightness(1)';
      }
    });
  });
  
  console.log('=== HVAC SLIDESHOW INITIALIZATION COMPLETE ===');
}