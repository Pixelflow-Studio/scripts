/**
 * ==================================================================================
 * HERO SLIDER - SWIPER & GSAP INTEGRATION (OPTIMIZED FOR PERFORMANCE)
 * ==================================================================================
 */

// Add CSS to work with existing pill-shaped progress bar design
const paginationStyles = `
  /* ==================================================================================
   * PAGINATION DESIGN VARIABLES - CUSTOMIZE HERE
   * ================================================================================== */
  :root {
    /* Pagination Container */
    --pagination-padding-top: 1.25rem;
    --pagination-padding-bottom: 1.25rem;
    
    /* Inactive Dots */
    --inactive-dot-size: 0.625rem;
    --inactive-dot-color: #e0e0e0;
    --inactive-dot-margin: 0.25rem;
    
    /* Active Dot (Pill Shape) */
    --active-dot-width: 3rem;
    --active-dot-height: 0.625rem;
    --active-dot-color: #e0e0e0;
    --active-dot-border-radius: 0.3125rem;
    
    /* Progress Bar (Fills the active dot) */
    --progress-bar-color: var(--base-color-brand--pink);
    
    /* Transitions */
    --pagination-transition: all 0.3s ease-in-out;
  }

  .swiper-pagination {
    padding-top: var(--pagination-padding-top) !important;
    padding-bottom: var(--pagination-padding-bottom) !important;
    position: relative !important;
    bottom: auto !important;
    --progress: 0%; /* Initialize the CSS variable */
  }

  /* Override Swiper's default pagination color */
  .swiper-pagination-bullet {
    background: var(--inactive-dot-color) !important;
    opacity: 1 !important;
  }

  /* Force ALL inactive dots to be perfect circles */
  .swiper-pagination-bullet:not(.swiper-pagination-bullet-active) {
    width: var(--inactive-dot-size) !important;
    height: var(--inactive-dot-size) !important;
    border-radius: 50% !important;
    background: var(--inactive-dot-color) !important;
    background-color: var(--inactive-dot-color) !important;
    transform: none !important;
    min-width: var(--inactive-dot-size) !important;
    max-width: var(--inactive-dot-size) !important;
    min-height: var(--inactive-dot-size) !important;
    max-height: var(--inactive-dot-size) !important;
    margin: 0 var(--inactive-dot-margin) !important;
    transition: var(--pagination-transition) !important;
    opacity: 1 !important;
  }

  /* Force active dot to be pill-shaped */
  .swiper-pagination-bullet-active {
    width: var(--active-dot-width) !important;
    height: var(--active-dot-height) !important;
    border-radius: var(--active-dot-border-radius) !important;
    background: var(--active-dot-color) !important;
    background-color: var(--active-dot-color) !important;
    position: relative !important;
    overflow: hidden !important;
    transform: none !important;
    min-width: var(--active-dot-width) !important;
    max-width: var(--active-dot-width) !important;
    min-height: var(--active-dot-height) !important;
    max-height: var(--active-dot-height) !important;
    margin: 0 var(--inactive-dot-margin) !important;
    transition: var(--pagination-transition) !important;
    opacity: 1 !important;
  }

  /* The actual progress bar that fills up */
  .swiper-pagination-bullet-active::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: var(--progress);
    background-color: var(--progress-bar-color);
    border-radius: var(--active-dot-border-radius);
  }

  /* Override any Swiper default styles that might cause issues */
  .swiper-pagination-bullet-active-main,
  .swiper-pagination-bullet-active-prev,
  .swiper-pagination-bullet-active-next {
    width: var(--inactive-dot-size) !important;
    height: var(--inactive-dot-size) !important;
    border-radius: 50% !important;
    background: var(--inactive-dot-color) !important;
    background-color: var(--inactive-dot-color) !important;
    transform: none !important;
    opacity: 1 !important;
  }

  /* Ensure no scaling or stretching occurs */
  .swiper-pagination-bullet * {
    border-radius: inherit !important;
  }

  /* Override Swiper's default opacity and color variables */
  .swiper-pagination-bullet {
    --swiper-pagination-color: var(--inactive-dot-color) !important;
    --swiper-pagination-bullet-inactive-color: var(--inactive-dot-color) !important;
    --swiper-pagination-bullet-inactive-opacity: 1 !important;
  }
`;

// Inject the styles
const styleSheet = document.createElement('style');
styleSheet.textContent = paginationStyles;
document.head.appendChild(styleSheet);

// --- 1. PERFORMANCE OPTIMIZED GSAP ANIMATION FUNCTIONS ---

// Cache animation configurations for better performance
const ANIMATION_CONFIG = {
  slideIn: {
    image: { scale: 1, duration: 1.2, ease: 'power2.out' },
    content: { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out' }
  },
  reset: {
    image: { scale: 1.15, duration: 0.8, ease: 'power2.inOut' },
    content: { opacity: 0, y: 20, duration: 0.2 }
  }
};

// Cache DOM elements to avoid repeated queries
let cachedElements = new Map();

function getCachedElement(slide, selector) {
  const key = `${slide.dataset.slideIndex || 'unknown'}-${selector}`;
  if (!cachedElements.has(key)) {
    cachedElements.set(key, slide.querySelector(selector));
  }
  return cachedElements.get(key);
}

function animateSlideIn(slide) {
  try {
    const image = getCachedElement(slide, '.hero-slide-img');
    const contentItems = slide.querySelectorAll('.gsap-stagger-item');
    
    if (!image || contentItems.length === 0) return;
    
    if (slide.classList.contains('swiper-slide-active')) {
      // Use more efficient GSAP animations
      gsap.to(image, ANIMATION_CONFIG.slideIn.image);
      gsap.fromTo(contentItems, 
        { opacity: 0, y: 20 }, 
        ANIMATION_CONFIG.slideIn.content
      );
    }
  } catch (error) {
    console.warn('Animation error:', error);
  }
}

function resetSlide(slide) {
  try {
    const image = getCachedElement(slide, '.hero-slide-img');
    const contentItems = slide.querySelectorAll('.gsap-stagger-item');
    
    if (!image || contentItems.length === 0) return;
    
    gsap.to(image, ANIMATION_CONFIG.reset.image);
    gsap.to(contentItems, ANIMATION_CONFIG.reset.content);
  } catch (error) {
    console.warn('Reset animation error:', error);
  }
}

// --- 2. OPTIMIZED SWIPER INITIALIZATION ---

// Cache pagination element once
const paginationEl = document.querySelector('.swiper-pagination');

// Performance monitoring (optional)
const performanceMonitor = {
  startTime: 0,
  start() {
    this.startTime = performance.now();
  },
  end(label) {
    const duration = performance.now() - this.startTime;
    if (duration > 16) { // Log if animation takes longer than 16ms (60fps)
      console.warn(`${label} took ${duration.toFixed(2)}ms`);
    }
  }
};

// Optimized event handlers
const eventHandlers = {
  init: function (swiper) {
    performanceMonitor.start();
    
    const slides = swiper.slides;
    const activeIndex = swiper.activeIndex;
    
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      slide.dataset.slideIndex = i; // Cache slide index for DOM queries
      
      if (i === activeIndex) {
        animateSlideIn(slide);
      } else {
        resetSlide(slide);
      }
    }
    
    // Fix pagination dots after initialization
    initializeAllBullets();
    
    performanceMonitor.end('Swiper init');
  },
  
  slideChangeTransitionStart: function (swiper) {
    performanceMonitor.start();
    
    const slides = swiper.slides;
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      if (!slide.classList.contains('swiper-slide-active')) {
        resetSlide(slide);
      }
    }
    
    // Enforce pagination styles during transition
    enforcePaginationStyles();
    
    performanceMonitor.end('Slide transition start');
  },

  slideChangeTransitionEnd: function (swiper) {
    performanceMonitor.start();
    
    const activeSlide = swiper.slides[swiper.activeIndex];
    if (activeSlide) {
      animateSlideIn(activeSlide);
    }
    
    // Fix pagination dots after slide change
    enforcePaginationStyles();
    
    performanceMonitor.end('Slide transition end');
  },
    
  autoplayTimeLeft: function(s, time, progress) {
    // Use requestAnimationFrame for smooth progress updates
    requestAnimationFrame(() => {
      if (paginationEl) {
        paginationEl.style.setProperty('--progress', (1 - progress) * 100 + '%');
      }
    });
  }
};

// Function to fix pagination dot shapes
function fixPaginationDots() {
  const bullets = document.querySelectorAll('.swiper-pagination-bullet');
  const rootStyles = getComputedStyle(document.documentElement);
  
  // Get CSS variables
  const inactiveDotSize = rootStyles.getPropertyValue('--inactive-dot-size').trim() || '0.625rem';
  const inactiveDotColor = rootStyles.getPropertyValue('--inactive-dot-color').trim() || '#e0e0e0';
  const activeDotWidth = rootStyles.getPropertyValue('--active-dot-width').trim() || '3rem';
  const activeDotHeight = rootStyles.getPropertyValue('--active-dot-height').trim() || '0.625rem';
  const activeDotBorderRadius = rootStyles.getPropertyValue('--active-dot-border-radius').trim() || '0.3125rem';
  
  bullets.forEach(bullet => {
    if (bullet.classList.contains('swiper-pagination-bullet-active')) {
      // Active dot should be pill-shaped
      bullet.style.setProperty('width', activeDotWidth, 'important');
      bullet.style.setProperty('height', activeDotHeight, 'important');
      bullet.style.setProperty('border-radius', activeDotBorderRadius, 'important');
      bullet.style.setProperty('background-color', inactiveDotColor, 'important');
      bullet.style.setProperty('background', inactiveDotColor, 'important');
      bullet.style.setProperty('opacity', '1', 'important');
      bullet.style.setProperty('transform', 'none', 'important');
      bullet.style.setProperty('min-width', activeDotWidth, 'important');
      bullet.style.setProperty('max-width', activeDotWidth, 'important');
      bullet.style.setProperty('min-height', activeDotHeight, 'important');
      bullet.style.setProperty('max-height', activeDotHeight, 'important');
    } else {
      // Inactive dots should be circular
      bullet.style.setProperty('width', inactiveDotSize, 'important');
      bullet.style.setProperty('height', inactiveDotSize, 'important');
      bullet.style.setProperty('border-radius', '50%', 'important');
      bullet.style.setProperty('background-color', inactiveDotColor, 'important');
      bullet.style.setProperty('background', inactiveDotColor, 'important');
      bullet.style.setProperty('opacity', '1', 'important');
      bullet.style.setProperty('transform', 'none', 'important');
      bullet.style.setProperty('min-width', inactiveDotSize, 'important');
      bullet.style.setProperty('max-width', inactiveDotSize, 'important');
      bullet.style.setProperty('min-height', inactiveDotSize, 'important');
      bullet.style.setProperty('max-height', inactiveDotSize, 'important');
    }
  });
}

// Run the fix more frequently to catch dynamic changes
function enforcePaginationStyles() {
  fixPaginationDots();
  // Run again after a short delay to catch any late changes
  setTimeout(fixPaginationDots, 50);
  setTimeout(fixPaginationDots, 150);
}

// Ensure all bullets are rendered and styled correctly on page load
function initializeAllBullets() {
  // Force Swiper to render all bullets
  if (swiper && swiper.pagination) {
    swiper.pagination.render();
    swiper.pagination.update();
  }
  
  // Wait a bit for rendering, then enforce styles
  setTimeout(() => {
    enforcePaginationStyles();
  }, 100);
}

// Initialize Swiper with optimized settings
const swiper = new Swiper('.hero-slider .swiper', {
  // --- BASE SETTINGS (APPLY TO SCREENS 991px AND SMALLER) ---
  slidesPerView: 1,
  centeredSlides: false,
  spaceBetween: 0,

  // --- Core Behavior (Inherited by all sizes) ---
  loop: true,
  speed: 600, // Reduced for better performance
  updateOnWindowResize: false, // Prevent unnecessary updates
  
  // --- Breakpoints Configuration ---
  breakpoints: {
    // --- SETTINGS FOR DESKTOP (992px AND WIDER) ---
    992: {
      slidesPerView: 'auto',
      centeredSlides: true,
      spaceBetween: 20,
    }
  },

  autoplay: {
    delay: 5000,
    disableOnInteraction: false,
    pauseOnMouseEnter: false,
    waitForTransition: true, // Prevent autoplay conflicts
  },
  
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
    dynamicBullets: false, // Show all bullets from the start
    renderBullet: function (index, className) {
      // Custom bullet rendering to work with pill-shaped active dot
      const isActive = className.includes('swiper-pagination-bullet-active');
      const width = isActive ? 'var(--active-dot-width, 3rem)' : 'var(--inactive-dot-size, 0.625rem)';
      const borderRadius = isActive ? 'var(--active-dot-border-radius, 0.3125rem)' : '50%';
      const backgroundColor = 'var(--inactive-dot-color, #e0e0e0)';
      const height = 'var(--active-dot-height, 0.625rem)';
      const margin = 'var(--inactive-dot-margin, 0.25rem)';
      
      return `<span class="${className}" style="width: ${width}; height: ${height}; border-radius: ${borderRadius}; background-color: ${backgroundColor}; margin: 0 ${margin};"></span>`;
    }
  },
  
  // --- Optimized Event Listeners ---
  on: eventHandlers
});

// --- 3. PERFORMANCE CLEANUP ---

// Clear cache when needed
function clearCache() {
  cachedElements.clear();
}

// Optional: Clear cache on window resize (debounced)
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    clearCache();
    fixPaginationDots(); // Fix dots after resize
  }, 250);
});

// Cleanup on page unload
window.addEventListener('beforeunload', clearCache);

// --- 4. MUTATION OBSERVER FOR DYNAMIC CHANGES ---

// Watch for any changes to the pagination and enforce styles
const paginationObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type === 'attributes' || mutation.type === 'childList') {
      enforcePaginationStyles();
    }
  });
});

// Start observing the pagination container
const paginationContainer = document.querySelector('.swiper-pagination');
if (paginationContainer) {
  paginationObserver.observe(paginationContainer, {
    attributes: true,
    childList: true,
    subtree: true
  });
}

// Ensure everything is properly initialized when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Give Swiper a moment to initialize, then ensure all bullets are visible
  setTimeout(() => {
    if (swiper && swiper.pagination) {
      initializeAllBullets();
    }
  }, 200);
});
