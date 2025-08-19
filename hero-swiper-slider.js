/**
 * ==================================================================================
 * HERO SLIDER - SWIPER & GSAP INTEGRATION (PRODUCTION READY)
 * ==================================================================================
 * Version: 1.0.0
 * Dependencies: Swiper.js, GSAP
 * Browser Support: Modern browsers (ES6+)
 * ==================================================================================
 */

// --- PRODUCTION CONFIGURATION ---
const HERO_SLIDER_CONFIG = {
  // Debug mode (set to false for production)
  debug: false,
  
  // Performance settings
  animationSpeed: 600,
  autoplayDelay: 5000,
  
  // CSS Variables (can be overridden by CSS)
  cssVariables: {
    paginationPaddingTop: '1.25rem',
    paginationPaddingBottom: '1.25rem',
    inactiveDotSize: '0.625rem',
    inactiveDotColor: '#e0e0e0',
    inactiveDotMargin: '0.25rem',
    activeDotWidth: '3rem',
    activeDotHeight: '0.625rem',
    activeDotColor: '#e0e0e0',
    activeDotBorderRadius: '0.3125rem',
    progressBarColor: 'var(--base-color-brand--pink)',
    paginationTransition: 'all 0.3s ease-in-out'
  },
  
  // Breakpoints
  breakpoints: {
    mobile: 991,
    desktop: 992
  },
  
  // Error handling
  maxRetries: 3,
  retryDelay: 1000
};

// --- PRODUCTION LOGGING ---
const Logger = {
  log: function(message, data = null) {
    if (HERO_SLIDER_CONFIG.debug) {
      console.log(`[Hero Slider] ${message}`, data || '');
    }
  },
  
  warn: function(message, data = null) {
    console.warn(`[Hero Slider] ${message}`, data || '');
  },
  
  error: function(message, error = null) {
    console.error(`[Hero Slider] ${message}`, error || '');
  }
};

// --- ERROR BOUNDARY ---
function withErrorBoundary(fn, context = 'Unknown') {
  return function(...args) {
    try {
      return fn.apply(this, args);
    } catch (error) {
      Logger.error(`Error in ${context}:`, error);
      // Graceful degradation - don't break the entire slider
      return null;
    }
  };
}

// Add CSS to work with existing pill-shaped progress bar design
const paginationStyles = `
  /* ==================================================================================
   * PAGINATION DESIGN VARIABLES - CUSTOMIZE HERE
   * ================================================================================== */
  :root {
    /* Pagination Container */
    --pagination-padding-top: ${HERO_SLIDER_CONFIG.cssVariables.paginationPaddingTop};
    --pagination-padding-bottom: ${HERO_SLIDER_CONFIG.cssVariables.paginationPaddingBottom};
    
    /* Inactive Dots */
    --inactive-dot-size: ${HERO_SLIDER_CONFIG.cssVariables.inactiveDotSize};
    --inactive-dot-color: ${HERO_SLIDER_CONFIG.cssVariables.inactiveDotColor};
    --inactive-dot-margin: ${HERO_SLIDER_CONFIG.cssVariables.inactiveDotMargin};
    
    /* Active Dot (Pill Shape) */
    --active-dot-width: ${HERO_SLIDER_CONFIG.cssVariables.activeDotWidth};
    --active-dot-height: ${HERO_SLIDER_CONFIG.cssVariables.activeDotHeight};
    --active-dot-color: ${HERO_SLIDER_CONFIG.cssVariables.activeDotColor};
    --active-dot-border-radius: ${HERO_SLIDER_CONFIG.cssVariables.activeDotBorderRadius};
    
    /* Progress Bar (Fills the active dot) */
    --progress-bar-color: ${HERO_SLIDER_CONFIG.cssVariables.progressBarColor};
    
    /* Transitions */
    --pagination-transition: ${HERO_SLIDER_CONFIG.cssVariables.paginationTransition};
  }

  .hero-slider .swiper-pagination {
    padding-top: var(--pagination-padding-top) !important;
    padding-bottom: var(--pagination-padding-bottom) !important;
    position: relative !important;
    bottom: auto !important;
    --progress: 0%; /* Initialize the CSS variable */
  }

  /* Override Swiper's default pagination color */
  .hero-slider .swiper-pagination-bullet {
    background: var(--inactive-dot-color) !important;
    opacity: 1 !important;
  }

  /* Force ALL inactive dots to be perfect circles */
  .hero-slider .swiper-pagination-bullet:not(.swiper-pagination-bullet-active) {
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
  .hero-slider .swiper-pagination-bullet-active {
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
  .hero-slider .swiper-pagination-bullet-active::before {
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
  .hero-slider .swiper-pagination-bullet-active-main,
  .hero-slider .swiper-pagination-bullet-active-prev,
  .hero-slider .swiper-pagination-bullet-active-next {
    width: var(--inactive-dot-size) !important;
    height: var(--inactive-dot-size) !important;
    border-radius: 50% !important;
    background: var(--inactive-dot-color) !important;
    background-color: var(--inactive-dot-color) !important;
    transform: none !important;
    opacity: 1 !important;
  }

  /* Ensure no scaling or stretching occurs */
  .hero-slider .swiper-pagination-bullet * {
    border-radius: inherit !important;
  }

  /* Override Swiper's default opacity and color variables */
  .hero-slider .swiper-pagination-bullet {
    --swiper-pagination-color: var(--inactive-dot-color) !important;
    --swiper-pagination-bullet-inactive-color: var(--inactive-dot-color) !important;
    --swiper-pagination-bullet-inactive-opacity: 1 !important;
  }
`;

// Safely inject the styles
function injectStyles() {
  try {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = paginationStyles;
    styleSheet.setAttribute('data-hero-slider', 'true');
    document.head.appendChild(styleSheet);
    Logger.log('Styles injected successfully');
  } catch (error) {
    Logger.error('Failed to inject styles:', error);
  }
}

// Inject styles immediately
injectStyles();

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
    const element = slide.querySelector(selector);
    if (element) {
      cachedElements.set(key, element);
    }
  }
  return cachedElements.get(key);
}

function animateSlideIn(slide) {
  return withErrorBoundary(() => {
    const image = getCachedElement(slide, '.hero-slide-img');
    const contentItems = slide.querySelectorAll('.gsap-stagger-item');
    
    if (!image || contentItems.length === 0) {
      Logger.warn('Required elements not found for animation');
      return;
    }
    
    if (slide.classList.contains('swiper-slide-active')) {
      // Use more efficient GSAP animations
      gsap.to(image, ANIMATION_CONFIG.slideIn.image);
      gsap.fromTo(contentItems, 
        { opacity: 0, y: 20 }, 
        ANIMATION_CONFIG.slideIn.content
      );
    }
  }, 'animateSlideIn')();
}

function resetSlide(slide) {
  return withErrorBoundary(() => {
    const image = getCachedElement(slide, '.hero-slide-img');
    const contentItems = slide.querySelectorAll('.gsap-stagger-item');
    
    if (!image || contentItems.length === 0) {
      Logger.warn('Required elements not found for reset');
      return;
    }
    
    gsap.to(image, ANIMATION_CONFIG.reset.image);
    gsap.to(contentItems, ANIMATION_CONFIG.reset.content);
  }, 'resetSlide')();
}

// --- 2. OPTIMIZED SWIPER INITIALIZATION ---

// Cache pagination element once
let paginationEl = null;

// Performance monitoring (optional)
const performanceMonitor = {
  startTime: 0,
  start() {
    this.startTime = performance.now();
  },
  end(label) {
    const duration = performance.now() - this.startTime;
    if (duration > 16) { // Log if animation takes longer than 16ms (60fps)
      Logger.warn(`${label} took ${duration.toFixed(2)}ms`);
    }
  }
};

// Optimized event handlers
const eventHandlers = {
  init: withErrorBoundary(function (swiper) {
    Logger.log('Hero slider init event fired');
    performanceMonitor.start();
    
    // Cache pagination element
    paginationEl = document.querySelector('.hero-slider .swiper-pagination');
    
    const slides = swiper.slides;
    const activeIndex = swiper.activeIndex;
    
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      slide.dataset.slideIndex = i; // Cache slide index for DOM queries
      
      if (i === activeIndex) {
        Logger.log('Animating initial slide:', i);
        animateSlideIn(slide);
      } else {
        resetSlide(slide);
      }
    }
    
    // Fix pagination dots after initialization
    initializeAllBullets();
    
    performanceMonitor.end('Swiper init');
  }, 'Swiper init'),
  
  slideChange: withErrorBoundary(function (swiper) {
    Logger.log('Slide change event fired, active index:', swiper.activeIndex);
  }, 'Slide change'),
  
  slideChangeTransitionStart: withErrorBoundary(function (swiper) {
    Logger.log('Slide transition start, active index:', swiper.activeIndex);
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
  }, 'Slide transition start'),

  slideChangeTransitionEnd: withErrorBoundary(function (swiper) {
    Logger.log('Slide transition end, active index:', swiper.activeIndex);
    performanceMonitor.start();
    
    const activeSlide = swiper.slides[swiper.activeIndex];
    if (activeSlide) {
      Logger.log('Animating new active slide');
      animateSlideIn(activeSlide);
    }
    
    // Fix pagination dots after slide change
    enforcePaginationStyles();
    
    performanceMonitor.end('Slide transition end');
  }, 'Slide transition end'),
    
  autoplayTimeLeft: withErrorBoundary(function(s, time, progress) {
    // Use requestAnimationFrame for smooth progress updates
    requestAnimationFrame(() => {
      if (paginationEl) {
        const progressPercent = (1 - progress) * 100;
        Logger.log('Autoplay progress:', progressPercent.toFixed(1) + '%');
        paginationEl.style.setProperty('--progress', progressPercent + '%');
      }
    });
  }, 'Autoplay progress')
};

// Function to fix pagination dot shapes
function fixPaginationDots() {
  return withErrorBoundary(() => {
    const bullets = document.querySelectorAll('.hero-slider .swiper-pagination-bullet');
    if (bullets.length === 0) {
      Logger.warn('No pagination bullets found');
      return;
    }
    
    const rootStyles = getComputedStyle(document.documentElement);
    
    // Get CSS variables with fallbacks
    const inactiveDotSize = rootStyles.getPropertyValue('--inactive-dot-size').trim() || HERO_SLIDER_CONFIG.cssVariables.inactiveDotSize;
    const inactiveDotColor = rootStyles.getPropertyValue('--inactive-dot-color').trim() || HERO_SLIDER_CONFIG.cssVariables.inactiveDotColor;
    const activeDotWidth = rootStyles.getPropertyValue('--active-dot-width').trim() || HERO_SLIDER_CONFIG.cssVariables.activeDotWidth;
    const activeDotHeight = rootStyles.getPropertyValue('--active-dot-height').trim() || HERO_SLIDER_CONFIG.cssVariables.activeDotHeight;
    const activeDotBorderRadius = rootStyles.getPropertyValue('--active-dot-border-radius').trim() || HERO_SLIDER_CONFIG.cssVariables.activeDotBorderRadius;
    
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
  }, 'fixPaginationDots')();
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
  return withErrorBoundary(() => {
    // Force Swiper to render all bullets
    if (heroSwiper && heroSwiper.pagination) {
      heroSwiper.pagination.render();
      heroSwiper.pagination.update();
    }
    
    // Wait a bit for rendering, then enforce styles
    setTimeout(() => {
      enforcePaginationStyles();
    }, 100);
  }, 'initializeAllBullets')();
}

// Initialize Hero Swiper with optimized settings
let heroSwiper = null;
let initializationRetries = 0;

function initializeHeroSwiper() {
  return withErrorBoundary(() => {
    // Check if hero slider exists and hasn't been initialized
    const heroSlider = document.querySelector('.hero-slider .swiper');
    if (!heroSlider) {
      Logger.warn('Hero slider not found');
      return false;
    }
    
    // Check if already initialized
    if (heroSlider.swiper) {
      Logger.log('Hero slider already initialized, destroying and reinitializing...');
      heroSlider.swiper.destroy(true, true);
      heroSwiper = null;
    }

    Logger.log('Initializing hero slider...');

    // Check for required dependencies
    if (typeof Swiper === 'undefined') {
      Logger.error('Swiper.js is not loaded');
      return false;
    }
    
    if (typeof gsap === 'undefined') {
      Logger.error('GSAP is not loaded');
      return false;
    }

    heroSwiper = new Swiper('.hero-slider .swiper', {
      // --- BASE SETTINGS (APPLY TO SCREENS 991px AND SMALLER) ---
      slidesPerView: 1,
      centeredSlides: false,
      spaceBetween: 0,

      // --- Core Behavior (Inherited by all sizes) ---
      loop: true,
      speed: HERO_SLIDER_CONFIG.animationSpeed,
      updateOnWindowResize: false, // Prevent unnecessary updates
      
      // --- Breakpoints Configuration ---
      breakpoints: {
        // --- SETTINGS FOR DESKTOP (992px AND WIDER) ---
        [HERO_SLIDER_CONFIG.breakpoints.desktop]: {
          slidesPerView: 'auto',
          centeredSlides: true,
          spaceBetween: 20,
        }
      },

      autoplay: {
        delay: HERO_SLIDER_CONFIG.autoplayDelay,
        disableOnInteraction: false,
        pauseOnMouseEnter: false,
        waitForTransition: true, // Prevent autoplay conflicts
      },
      
      pagination: {
        el: '.hero-slider .swiper-pagination',
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
    
    Logger.log('Hero slider initialized successfully');
    return true;
  }, 'initializeHeroSwiper')();
}

// Retry initialization with exponential backoff
function retryInitialization() {
  if (initializationRetries < HERO_SLIDER_CONFIG.maxRetries) {
    initializationRetries++;
    Logger.warn(`Retrying initialization (attempt ${initializationRetries}/${HERO_SLIDER_CONFIG.maxRetries})`);
    
    setTimeout(() => {
      if (!initializeHeroSwiper()) {
        retryInitialization();
      }
    }, HERO_SLIDER_CONFIG.retryDelay * initializationRetries);
  } else {
    Logger.error('Failed to initialize hero slider after maximum retries');
  }
}

// --- 3. PERFORMANCE CLEANUP ---

// Clear cache when needed
function clearCache() {
  cachedElements.clear();
  Logger.log('Cache cleared');
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
let paginationObserver = null;

function setupPaginationObserver() {
  return withErrorBoundary(() => {
    const paginationContainer = document.querySelector('.hero-slider .swiper-pagination');
    if (paginationContainer && !paginationObserver) {
      paginationObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'attributes' || mutation.type === 'childList') {
            enforcePaginationStyles();
          }
        });
      });

      paginationObserver.observe(paginationContainer, {
        attributes: true,
        childList: true,
        subtree: true
      });
      
      Logger.log('Pagination observer setup complete');
    }
  }, 'setupPaginationObserver')();
}

// --- 5. INITIALIZATION WITH CONFLICT PREVENTION ---

// Wait for DOM and other scripts to load
document.addEventListener('DOMContentLoaded', function() {
  Logger.log('DOMContentLoaded - attempting hero slider initialization');
  // Give other scripts time to initialize
  setTimeout(() => {
    if (!initializeHeroSwiper()) {
      retryInitialization();
    } else {
      // Ensure everything is properly initialized
      setTimeout(() => {
        if (heroSwiper && heroSwiper.pagination) {
          Logger.log('Initializing bullets after hero slider init');
          initializeAllBullets();
          setupPaginationObserver();
        }
      }, 200);
    }
  }, 1000); // Increased delay to prevent conflicts
});

// Also try to initialize on window load as backup
window.addEventListener('load', function() {
  Logger.log('Window load - checking hero slider');
  if (!heroSwiper) {
    Logger.log('Hero slider not initialized, trying again');
    setTimeout(() => {
      if (!initializeHeroSwiper()) {
        retryInitialization();
      }
    }, 100);
  } else {
    Logger.log('Hero slider already initialized');
  }
});

// Additional initialization attempt after a longer delay
setTimeout(() => {
  if (!heroSwiper) {
    Logger.log('Delayed initialization attempt');
    if (!initializeHeroSwiper()) {
      retryInitialization();
    }
  }
}, 2000);

// --- 6. PUBLIC API FOR EXTERNAL CONTROL ---
window.HeroSlider = {
  // Get the swiper instance
  getInstance: () => heroSwiper,
  
  // Manually go to slide
  goToSlide: (index) => {
    if (heroSwiper) {
      heroSwiper.slideTo(index);
    }
  },
  
  // Start/stop autoplay
  startAutoplay: () => {
    if (heroSwiper && heroSwiper.autoplay) {
      heroSwiper.autoplay.start();
    }
  },
  
  stopAutoplay: () => {
    if (heroSwiper && heroSwiper.autoplay) {
      heroSwiper.autoplay.stop();
    }
  },
  
  // Destroy the slider
  destroy: () => {
    if (heroSwiper) {
      heroSwiper.destroy(true, true);
      heroSwiper = null;
      clearCache();
      if (paginationObserver) {
        paginationObserver.disconnect();
        paginationObserver = null;
      }
    }
  },
  
  // Reinitialize the slider
  reinitialize: () => {
    window.HeroSlider.destroy();
    setTimeout(() => {
      initializeHeroSwiper();
    }, 100);
  },
  
  // Get configuration
  getConfig: () => HERO_SLIDER_CONFIG,
  
  // Update configuration
  updateConfig: (newConfig) => {
    Object.assign(HERO_SLIDER_CONFIG, newConfig);
    Logger.log('Configuration updated:', newConfig);
  }
};

Logger.log('Hero Slider script loaded successfully'); 
