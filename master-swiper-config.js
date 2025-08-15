// ===================================================================
// MASTER SWIPER INITIALIZER (v2 - With MutationObserver & Performance Optimizations)
// ===================================================================

(function() {
  // PERFORMANCE OPTIMIZATION UTILITIES
  // -------------------------------------------------------------------
  
  // Feature detection for low-end devices
  const isLowEndDevice = () => {
      // Check for low memory devices
      if (navigator.deviceMemory && navigator.deviceMemory < 4) return true;
      
      // Check for slow CPU (using hardware concurrency)
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return true;
      
      // Check for slow connection
      if (navigator.connection) {
          const connection = navigator.connection;
          if (connection.effectiveType === 'slow-2g' || 
              connection.effectiveType === '2g' || 
              connection.effectiveType === '3g') return true;
      }
      
      // Check for reduced motion preference
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
      
      return false;
  };
  
  // Debounce utility function
  const debounce = (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
          const later = () => {
              clearTimeout(timeout);
              func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
      };
  };
  
  // Simplified easing for low-end devices
  const getOptimizedEasing = (swiperEl) => {
      if (isLowEndDevice()) {
          return 'ease-out';
      }
      
      // Check for easing type attribute
      const easingType = swiperEl.getAttribute('data-swiper-easing-type');
      if (easingType) {
          switch (easingType) {
              case 'fast':
                  return 'cubic-bezier(0.25, 0.1, 0.25, 1)';
              case 'smooth':
                  return 'cubic-bezier(0.4, 0, 0.2, 1)';
              case 'bouncy':
                  return 'cubic-bezier(0.34, 1.56, 0.64, 1)';
              case 'ease-out':
                  return 'ease-out';
              case 'ease-in-out':
                  return 'ease-in-out';
              case 'linear':
                  return 'linear';
              default:
                  return 'cubic-bezier(0.4, 0, 0.2, 1)'; // Material Design default
          }
      }
      
      // Default easing for product cards
      return 'cubic-bezier(0.25, 0.1, 0.25, 1)';
  };
  

  
  // Optimized animation speed for low-end devices
  const getOptimizedSpeed = () => {
      return isLowEndDevice() ? 400 : 600;
  };

  // HERO SLIDER - GSAP INTEGRATION & PAGINATION STYLES
  // -------------------------------------------------------------------
  
  // Add CSS for hero slider pagination
  const heroPaginationStyles = `
    /* ==================================================================================
     * HERO SLIDER PAGINATION DESIGN VARIABLES - CUSTOMIZE HERE
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

  // Inject hero slider styles
  if (!document.getElementById('hero-slider-styles')) {
    const heroStyleSheet = document.createElement('style');
    heroStyleSheet.id = 'hero-slider-styles';
    heroStyleSheet.textContent = heroPaginationStyles;
    document.head.appendChild(heroStyleSheet);
  }

  // HERO SLIDER - GSAP ANIMATION FUNCTIONS
  // -------------------------------------------------------------------
  
  // Cache animation configurations for better performance
  const HERO_ANIMATION_CONFIG = {
    slideIn: {
      image: { scale: 1, duration: 1.2, ease: 'power2.out' },
      content: { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out' }
    },
    reset: {
      image: { scale: 1.15, duration: 0.8, ease: 'power2.inOut' },
      content: { opacity: 0, y: 20, duration: 0.2 }
    }
  };

  // Cache DOM elements for hero slider
  let heroCachedElements = new Map();

  function getHeroCachedElement(slide, selector) {
    const key = `${slide.dataset.slideIndex || 'unknown'}-${selector}`;
    if (!heroCachedElements.has(key)) {
      heroCachedElements.set(key, slide.querySelector(selector));
    }
    return heroCachedElements.get(key);
  }

  function animateHeroSlideIn(slide) {
    try {
      const image = getHeroCachedElement(slide, '.hero-slide-img');
      const contentItems = slide.querySelectorAll('.gsap-stagger-item');
      
      if (!image || contentItems.length === 0) return;
      
      if (slide.classList.contains('swiper-slide-active')) {
        // Use more efficient GSAP animations
        if (typeof gsap !== 'undefined') {
          gsap.to(image, HERO_ANIMATION_CONFIG.slideIn.image);
          gsap.fromTo(contentItems, 
            { opacity: 0, y: 20 }, 
            HERO_ANIMATION_CONFIG.slideIn.content
          );
        }
      }
    } catch (error) {
      console.warn('Hero animation error:', error);
    }
  }

  function resetHeroSlide(slide) {
    try {
      const image = getHeroCachedElement(slide, '.hero-slide-img');
      const contentItems = slide.querySelectorAll('.gsap-stagger-item');
      
      if (!image || contentItems.length === 0) return;
      
      if (typeof gsap !== 'undefined') {
        gsap.to(image, HERO_ANIMATION_CONFIG.reset.image);
        gsap.to(contentItems, HERO_ANIMATION_CONFIG.reset.content);
      }
    } catch (error) {
      console.warn('Hero reset animation error:', error);
    }
  }

  // HERO SLIDER - PAGINATION FUNCTIONS
  // -------------------------------------------------------------------
  
  // Cache pagination element once
  let heroPaginationEl = null;

  // Performance monitoring for hero slider
  const heroPerformanceMonitor = {
    startTime: 0,
    start() {
      this.startTime = performance.now();
    },
    end(label) {
      const duration = performance.now() - this.startTime;
      if (duration > 16) { // Log if animation takes longer than 16ms (60fps)
        console.warn(`Hero ${label} took ${duration.toFixed(2)}ms`);
      }
    }
  };

  // Function to fix hero pagination dot shapes
  function fixHeroPaginationDots() {
    const bullets = document.querySelectorAll('.hero-slider .swiper-pagination-bullet');
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
        bullet.style.setProperty('margin', `0 ${inactiveDotSize}`, 'important');
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
        bullet.style.setProperty('margin', `0 ${inactiveDotSize}`, 'important');
      }
    });
  }

  // Run the fix more frequently to catch dynamic changes
  function enforceHeroPaginationStyles() {
    fixHeroPaginationDots();
    // Run again after a short delay to catch any late changes
    setTimeout(fixHeroPaginationDots, 50);
    setTimeout(fixHeroPaginationDots, 150);
  }

  // Ensure all bullets are rendered and styled correctly on page load
  function initializeHeroBullets() {
    // Force Swiper to render all bullets
    const heroSlider = document.querySelector('.hero-slider .swiper.is-hero-slider');
    if (heroSlider && heroSlider.swiper && heroSlider.swiper.pagination) {
      heroSlider.swiper.pagination.render();
      heroSlider.swiper.pagination.update();
    }
    
    // Wait a bit for rendering, then enforce styles
    setTimeout(() => {
      enforceHeroPaginationStyles();
    }, 100);
  }

  // 1. DEFINE ALL SLIDER CONFIGURATIONS
  // -------------------------------------------------------------------
  const swiperConfigurations = [
  
             {
           selector: '[data-swiper="category"] .swiper',
           options: {
               slidesPerView: 5.5,
               spaceBetween: 20,
               loop: false,
               speed: getOptimizedSpeed(),
               easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // Will be overridden dynamically
               navigation: {
                   nextEl: '[data-swiper="category"] .swiper-next',
                   prevEl: '[data-swiper="category"] .swiper-prev',
               },
               scrollbar: {
                   el: '[data-swiper="category"] .swiper-scrollbar',
                   draggable: true,
               },
               breakpoints: {
                   0: { slidesPerView: 1.6, spaceBetween: 10 },
                   480: { slidesPerView: 2.2, spaceBetween: 10 },
                   768: { slidesPerView: 3.2, spaceBetween: 20 },
                   992: { slidesPerView: 5.5, spaceBetween: 20 },
               }
           }
       },
      
               {
           selector: '[data-swiper="best-sellers"] .swiper',
           options: {
               slidesPerView: 4.5,
               spaceBetween: 20,
               loop: false,
               speed: getOptimizedSpeed(),
               easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // Will be overridden dynamically
               navigation: {
                   nextEl: '[data-swiper="best-sellers"] .swiper-next',
                   prevEl: '[data-swiper="best-sellers"] .swiper-prev',
               },
               scrollbar: {
                   el: '[data-swiper="best-sellers"] .swiper-scrollbar',
                   draggable: true,
               },
               breakpoints: {
                   0: { slidesPerView: 1.2, spaceBetween: 10 },
                   480: { slidesPerView: 2.2, spaceBetween: 10 },
                   768: { slidesPerView: 2.5, spaceBetween: 20 },
                   992: { slidesPerView: 4.5, spaceBetween: 20 },
               }
           }
       },
       
       {
           selector: '[data-swiper="tanning"] .swiper',
           options: {
               slidesPerView: 3,
               spaceBetween: 20,
               loop: false,
               speed: getOptimizedSpeed(),
               easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // Will be overridden dynamically
               navigation: {
                   nextEl: '[data-swiper="tanning"] .swiper-next',
                   prevEl: '[data-swiper="tanning"] .swiper-prev',
               },
               scrollbar: {
                   el: '[data-swiper="tanning"] .swiper-scrollbar',
                   draggable: true,
               },
               breakpoints: {
                   0: { slidesPerView: 1.2, spaceBetween: 10 },
                   480: { slidesPerView: 2.2, spaceBetween: 10 },
                   768: { slidesPerView: 2.5, spaceBetween: 20 },
                   992: { slidesPerView: 3, spaceBetween: 20 },
               }
           }
       },
       
       {
           selector: '[data-swiper="offers"] .swiper',
           options: {
               slidesPerView: 3,
               spaceBetween: 20,
               loop: false,
               speed: getOptimizedSpeed(),
               easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // Will be overridden dynamically
               navigation: {
                   nextEl: '[data-swiper="offers"] .swiper-next',
                   prevEl: '[data-swiper="offers"] .swiper-prev',
               },
               scrollbar: {
                   el: '[data-swiper="offers"] .swiper-scrollbar',
                   draggable: true,
               },
               breakpoints: {
                   0: { slidesPerView: 1.2, spaceBetween: 10 },
                   480: { slidesPerView: 2.2, spaceBetween: 10 },
                   768: { slidesPerView: 2.5, spaceBetween: 20 },
                   992: { slidesPerView: 3, spaceBetween: 20 },
               }
           }
       },

       // HERO SLIDER CONFIGURATION
       {
           selector: '.hero-slider .swiper.is-hero-slider',
           options: {
               slidesPerView: 1,
               centeredSlides: false,
               spaceBetween: 0,
               loop: true,
               speed: getOptimizedSpeed(),
               updateOnWindowResize: false,
               
               breakpoints: {
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
                   waitForTransition: true,
               },
               
               pagination: {
                   el: '.hero-slider .swiper-pagination',
                   clickable: true,
                   dynamicBullets: false,
                   renderBullet: function (index, className) {
                       const isActive = className.includes('swiper-pagination-bullet-active');
                       const width = isActive ? 'var(--active-dot-width, 3rem)' : 'var(--inactive-dot-size, 0.625rem)';
                       const borderRadius = isActive ? 'var(--active-dot-border-radius, 0.3125rem)' : '50%';
                       const backgroundColor = 'var(--inactive-dot-color, #e0e0e0)';
                       const height = 'var(--active-dot-height, 0.625rem)';
                       const margin = 'var(--inactive-dot-margin, 0.25rem)';
                       
                       return `<span class="${className}" style="width: ${width}; height: ${height}; border-radius: ${borderRadius}; background-color: ${backgroundColor}; margin: 0 ${margin};"></span>`;
                   }
               },
               
               on: {
                   init: function (swiper) {
                       console.log('Hero slider init event fired');
                       heroPerformanceMonitor.start();
                       
                       const slides = swiper.slides;
                       const activeIndex = swiper.activeIndex;
                       
                       for (let i = 0; i < slides.length; i++) {
                           const slide = slides[i];
                           slide.dataset.slideIndex = i;
                           
                           if (i === activeIndex) {
                               console.log('Animating initial hero slide:', i);
                               animateHeroSlideIn(slide);
                           } else {
                               resetHeroSlide(slide);
                           }
                       }
                       
                       // Fix pagination dots after initialization
                       initializeHeroBullets();
                       
                       heroPerformanceMonitor.end('Hero Swiper init');
                   },
                   
                   slideChange: function (swiper) {
                       console.log('Hero slide change event fired, active index:', swiper.activeIndex);
                   },
                   
                   slideChangeTransitionStart: function (swiper) {
                       console.log('Hero slide transition start, active index:', swiper.activeIndex);
                       heroPerformanceMonitor.start();
                       
                       const slides = swiper.slides;
                       for (let i = 0; i < slides.length; i++) {
                           const slide = slides[i];
                           if (!slide.classList.contains('swiper-slide-active')) {
                               resetHeroSlide(slide);
                           }
                       }
                       
                       // Enforce pagination styles during transition
                       enforceHeroPaginationStyles();
                       
                       heroPerformanceMonitor.end('Hero slide transition start');
                   },

                   slideChangeTransitionEnd: function (swiper) {
                       console.log('Hero slide transition end, active index:', swiper.activeIndex);
                       heroPerformanceMonitor.start();
                       
                       const activeSlide = swiper.slides[swiper.activeIndex];
                       if (activeSlide) {
                           console.log('Animating new active hero slide');
                           animateHeroSlideIn(activeSlide);
                       }
                       
                       // Fix pagination dots after slide change
                       enforceHeroPaginationStyles();
                       
                       heroPerformanceMonitor.end('Hero slide transition end');
                   },
                       
                   autoplayTimeLeft: function(s, time, progress) {
                       // Use requestAnimationFrame for smooth progress updates
                       requestAnimationFrame(() => {
                           if (!heroPaginationEl) {
                               heroPaginationEl = document.querySelector('.hero-slider .swiper-pagination');
                           }
                           if (heroPaginationEl) {
                               const progressPercent = (1 - progress) * 100;
                               console.log('Hero autoplay progress:', progressPercent.toFixed(1) + '%');
                               heroPaginationEl.style.setProperty('--progress', progressPercent + '%');
                           }
                       });
                   }
               }
           }
       },
      // Add more configurations here as needed
   
  ];

  // 2. INITIALIZATION & OBSERVATION LOGIC
  // -------------------------------------------------------------------
  
  // Cache for tracking initialized swipers and their states
  const swiperCache = new Map();
  
  // Optimized DOM query cache
  const domCache = new Map();
  
  // Cached DOM query function
  const cachedQuerySelector = (selector) => {
      if (!domCache.has(selector)) {
          domCache.set(selector, document.querySelectorAll(selector));
      }
      return domCache.get(selector);
  };
  
  // Clear DOM cache when needed
  const clearDomCache = () => {
      domCache.clear();
  };
  
  // Track if page is being restored from cache
  let isPageRestored = false;
  
  // Track initialization state
  let isInitializing = false;
  
  function setupSwipers() {
      // Check if Swiper is available
      if (typeof Swiper === 'undefined') {
          console.warn('Swiper library not loaded. Skipping initialization.');
          return;
      }
      
      // Prevent multiple simultaneous initializations
      if (isInitializing) {
          return;
      }
      
      isInitializing = true;
      
      // Add class to body to indicate JavaScript is running
      document.body.classList.add('swiper-js-loaded');
      
      // Add performance optimization class for low-end devices
      if (isLowEndDevice()) {
          document.body.classList.add('swiper-low-end-device');
      }
      
      // If page is restored from cache, add special class for smooth transitions
      if (isPageRestored) {
          document.body.classList.add('swiper-restored');
      }
      
      // Add CSS to hide slides initially - only when JavaScript is running
      if (!document.getElementById('swiper-hide-styles')) {
          const style = document.createElement('style');
          style.id = 'swiper-hide-styles';
          style.textContent = `
              /* Only hide swipers when page is being restored from cache */
              .swiper-restored .swiper:not(.swiper-ready) {
                  opacity: 0 !important;
                  visibility: hidden !important;
                  transition: opacity 0.3s ease, visibility 0.3s ease;
              }
              
              /* Show swipers when they're ready (only for restored pages) */
              .swiper-restored .swiper.swiper-ready {
                  opacity: 1 !important;
                  visibility: visible !important;
              }
              
              /* Keep swipers visible during normal page transitions */
              .swiper-js-loaded:not(.swiper-restored) .swiper {
                  opacity: 1 !important;
                  visibility: visible !important;
              }
              
              /* Only apply hiding when JavaScript is running and Swiper is available */
              .swiper-js-loaded .swiper:not(.swiper-initialized):not(.swiper-flex-mode) .swiper-wrapper {
                  opacity: 0;
                  transition: opacity 0.3s ease;
              }
              .swiper-js-loaded .swiper.swiper-initialized .swiper-wrapper,
              .swiper-js-loaded .swiper.swiper-flex-mode .swiper-wrapper {
                  opacity: 1;
              }
              
              /* Exception for hero slider - always visible */
              .swiper-js-loaded .swiper.is-hero-slider .swiper-wrapper {
                  opacity: 1 !important;
              }
              
              /* HERO SLIDER SPECIFIC STYLES - Always visible */
              .hero-slider .swiper.is-hero-slider {
                  opacity: 1 !important;
                  visibility: visible !important;
              }
              .hero-slider .swiper.is-hero-slider .swiper-wrapper {
                  opacity: 1 !important;
                  visibility: visible !important;
              }
              .hero-slider .swiper.is-hero-slider .swiper-slide {
                  opacity: 1 !important;
                  visibility: visible !important;
              }
              
              /* AGGRESSIVE OVERRIDE FOR JSDELIVR SCENARIOS */
              .hero-slider .swiper-wrapper,
              .hero-slider .swiper-slide,
              .hero-slider .swiper {
                  opacity: 1 !important;
                  visibility: visible !important;
                  display: block !important;
              }
              
              /* Force hero slider visibility even before JS loads */
              .hero-slider {
                  opacity: 1 !important;
                  visibility: visible !important;
              }
              
              /* Performance optimizations for low-end devices */
              .swiper-low-end-device .swiper-wrapper {
                  will-change: auto;
              }
              .swiper-low-end-device .swiper-slide {
                  will-change: auto;
              }
              
              /* Smooth transitions for restored pages */
              .swiper-restored .swiper-wrapper {
                  transition: opacity 0.5s ease-in-out !important;
              }
              
              /* Prevent flash during page transitions */
              .swiper {
                  min-height: 200px;
                  transition: opacity 0.3s ease;
              }
              
              /* Smooth loading state */
              .swiper-loading {
                  opacity: 0.7;
                  transition: opacity 0.3s ease;
              }
              
              .swiper-loaded {
                  opacity: 1;
              }
          `;
          document.head.appendChild(style);
      }
      
      // Only hide swipers if page is being restored from cache
      if (isPageRestored) {
          const allSwipers = document.querySelectorAll('.swiper');
          allSwipers.forEach(swiperEl => {
              swiperEl.classList.remove('swiper-ready');
              const wrapperEl = swiperEl.querySelector('.swiper-wrapper');
              if (wrapperEl) {
                  // Force slides to be visible with smooth transition
                  wrapperEl.style.opacity = '1';
                  wrapperEl.style.transition = 'opacity 0.5s ease-in-out';
              }
          });
      }

      swiperConfigurations.forEach(config => {
          const swiperElements = cachedQuerySelector(config.selector);
          
          // Skip if no elements found for this configuration
          if (swiperElements.length === 0) {
              console.log(`No elements found for selector: ${config.selector}`);
              return;
          }
          
          console.log(`Found ${swiperElements.length} elements for selector: ${config.selector}`);
          
          swiperElements.forEach(swiperEl => {
              const wrapperEl = swiperEl.querySelector('.swiper-wrapper');
              if (!wrapperEl) {
                  console.warn(`No .swiper-wrapper found for selector: ${config.selector}`);
                  return;
              }

              // THE CORE LOGIC
              const initOrUpdateSwiper = () => {
                  try {
                      const cacheKey = `${config.selector}-${swiperEl.dataset.swiperId || swiperEl.id || swiperEl.className}`;
                      const cachedData = swiperCache.get(cacheKey);
                      const slideCount = wrapperEl.querySelectorAll('.swiper-slide').length;
                      
                      // Check if we need to reinitialize (new slides, different count, or no cache)
                      const needsReinit = !cachedData || 
                                       cachedData.slideCount !== slideCount ||
                                       !swiperEl.swiper;
                      
                      if (needsReinit) {
                          // Destroy existing instance if it exists
                          if (swiperEl.swiper) {
                              swiperEl.swiper.destroy(true, true);
                          }
                          
                                                // Check if we should initialize swiper based on slide count
                      if (slideCount > 0) {
                          // Special handling for hero slider - always initialize as Swiper
                          const isHeroSlider = swiperEl.classList.contains('is-hero-slider');
                          
                          // If 4 or fewer slides, only use flex mode on desktop (but not for hero slider)
                          const isMobile = window.innerWidth <= 768;
                          
                          if (slideCount <= 4 && !isMobile && !isHeroSlider) {
                              // Desktop: Remove swiper classes and show slides normally (for non-hero sliders)
                              swiperEl.classList.remove('swiper-initialized');
                              swiperEl.classList.add('swiper-flex-mode');
                              wrapperEl.style.display = '';
                              wrapperEl.style.gap = '20px';
                              
                              // Preserve original slide styling by removing Swiper's inline styles
                              const slides = wrapperEl.querySelectorAll('.swiper-slide');
                              slides.forEach(slide => {
                                  // Calculate width based on slide count
                                  const slideWidth = slideCount === 3 ? 'calc(33.333% - 15px)' : 'calc(25% - 15px)';
                                  slide.style.width = slideWidth;
                                  slide.style.flexShrink = '0';
                                  slide.style.flexGrow = '0';
                                  slide.style.flexBasis = 'auto';
                              });
                              
                              // Hide navigation and scrollbar elements
                              const navElements = swiperEl.querySelectorAll('.swiper-next, .swiper-prev, .swiper-scrollbar, .slider_arrow');
                              navElements.forEach(el => el.style.display = 'none');
                              
                              // Also hide the pagination container if it exists
                              const parentContainer = swiperEl.closest('[data-swiper="best-sellers"], [data-swiper="category"], [data-swiper="tanning"], [data-swiper="offers"]');
                              if (parentContainer) {
                                  const paginationContainer = parentContainer.querySelector('.swiper-pagination_elements');
                                  if (paginationContainer) {
                                      paginationContainer.style.display = 'none';
                                  }
                              }
                              
                              // Mark as ready and show (only for restored pages)
                              if (isPageRestored) {
                                  swiperEl.classList.add('swiper-ready');
                              }
                              
                              console.log(`Swiper not initialized for ${config.selector} - only ${slideCount} slides (4 or fewer) on desktop`);
                          } else {
                              // Mobile OR more than 4 slides OR hero slider: Initialize swiper normally
                              const swiper = new Swiper(swiperEl, config.options);
              
                              // Ensure easing is properly applied after initialization
                              if (swiper.params && swiper.params.easing) {
                                  swiper.params.easing = getOptimizedEasing(swiperEl);
                              }
                                  
                              // Force update to ensure easing is applied
                              swiper.update();
                              swiper.updateSlides();
                              swiper.updateProgress();
                              
                              // Show the slides after initialization
                              swiperEl.classList.add('swiper-initialized');
                              
                              // Show navigation and scrollbar elements (but not for hero slider)
                              if (!isHeroSlider) {
                                  const navElements = swiperEl.querySelectorAll('.swiper-next, .swiper-prev, .swiper-scrollbar, .slider_arrow');
                                  navElements.forEach(el => el.style.display = '');
                                  
                                  // Also show the pagination container if it exists
                                  const parentContainer = swiperEl.closest('[data-swiper="best-sellers"], [data-swiper="category"], [data-swiper="tanning"], [data-swiper="offers"]');
                                  if (parentContainer) {
                                      const paginationContainer = parentContainer.querySelector('.swiper-pagination_elements');
                                      if (paginationContainer) {
                                          paginationContainer.style.display = '';
                                      }
                                  }
                              }
                              
                              // Mark as ready and show (only for restored pages)
                              if (isPageRestored) {
                                  swiperEl.classList.add('swiper-ready');
                              }
                              
                              console.log(`Swiper initialized for: ${config.selector} - ${slideCount} slides${isHeroSlider ? ' (hero slider)' : ''}`);
                          }
                              
                              // Cache the new state
                              swiperCache.set(cacheKey, {
                                  slideCount: slideCount,
                                  timestamp: Date.now(),
                                  config: config.selector
                              });
                          }
                      } else if (swiperEl.swiper) {
                          // Just update existing instance
                          swiperEl.swiper.update();
                          swiperEl.classList.add('swiper-initialized');
                          // Only add ready class for restored pages
                          if (isPageRestored) {
                              swiperEl.classList.add('swiper-ready');
                          }
                          //console.log(`Swiper updated for: ${config.selector}`);
                      }
                  } catch (error) {
                      console.error(`Error initializing/updating Swiper for ${config.selector}:`, error);
                      // Mark as ready even if there's an error to prevent permanent hiding (only for restored pages)
                      if (isPageRestored) {
                          swiperEl.classList.add('swiper-ready');
                      }
                  }
              };
              
              // Run once immediately in case slides are already there
              initOrUpdateSwiper();

              // Create an observer to watch for slides being added later
              const observer = new MutationObserver((mutations) => {
                  // We only need to know that a change happened, not which one.
                  // A simple re-run of our logic is enough.
                  initOrUpdateSwiper();
                  
                  // Optional: once initialized, we might not need to observe anymore
                  // if the slide content is static after the first load.
                  // if (swiperEl.swiper) {
                  //   observer.disconnect();
                  // }
              });

              // Start observing the swiper-wrapper for new child elements
              observer.observe(wrapperEl, { childList: true });

              // Store observer reference for potential cleanup
              swiperEl._swiperObserver = observer;
          });
      });
      
      // Remove restored class after initialization
      if (isPageRestored) {
          setTimeout(() => {
              document.body.classList.remove('swiper-restored');
              isPageRestored = false;
          }, 1000);
      }
      
      // Reset initialization flag
      isInitializing = false;
  }

  /**
   * Finds all existing Swiper instances and calls their update() method.
   * This is still needed for the back/forward cache.
   */
  function updateAllSwipersOnPageShow() {
      swiperConfigurations.forEach(config => {
          const swiperElements = cachedQuerySelector(config.selector);
          swiperElements.forEach(element => {
              if (element.swiper) {
                  try {
                      // Force update to restore proper state
                      element.swiper.update();
                      
                      // Re-enable easing by re-applying the easing configuration
                      if (element.swiper.params && element.swiper.params.easing) {
                          element.swiper.params.easing = config.options.easing;
                      }
                      
                      // Force a small update to ensure easing is applied
                      element.swiper.updateSlides();
                      element.swiper.updateProgress();
                      
                      // Ensure cached state is maintained
                      const cacheKey = `${config.selector}-${element.dataset.swiperId || element.id || element.className}`;
                      const cachedData = swiperCache.get(cacheKey);
                      if (cachedData) {
                          cachedData.timestamp = Date.now();
                      }
                      
                      console.log(`Swiper updated and easing restored for: ${config.selector}`);
                  } catch (error) {
                      console.error(`Error updating Swiper for ${config.selector}:`, error);
                  }
              }
          });
      });
  }

  /**
   * Cleanup function to disconnect observers and destroy Swiper instances
   */
  function cleanupSwipers() {
      swiperConfigurations.forEach(config => {
          const swiperElements = cachedQuerySelector(config.selector);
          swiperElements.forEach(element => {
              // Disconnect observer if it exists
              if (element._swiperObserver) {
                  element._swiperObserver.disconnect();
                  delete element._swiperObserver;
              }
              
              // Destroy Swiper instance if it exists
              if (element.swiper) {
                  try {
                      element.swiper.destroy(true, true);
                  } catch (error) {
                      console.error(`Error destroying Swiper for ${config.selector}:`, error);
                  }
              }
          });
      });
      
      // Clear the cache
      swiperCache.clear();
      clearDomCache();
    }

  // 3. EVENT LISTENERS
  // -------------------------------------------------------------------
  
  // Run the main setup when the DOM is ready.
  document.addEventListener('DOMContentLoaded', setupSwipers);
  
  // Also run on window load to catch any late-loading content
  window.addEventListener('load', () => {
      // Small delay to ensure all content is loaded
      setTimeout(setupSwipers, 100);
  });
  
  // Additional safeguard for jsDelivr and external script loading
  // Check if script is loaded after DOM is ready
  if (document.readyState === 'loading') {
      // DOM is still loading, wait for it
      document.addEventListener('DOMContentLoaded', setupSwipers);
  } else {
      // DOM is already ready, run immediately
      setupSwipers();
  }
  
  // Multiple initialization attempts for jsDelivr scenarios
  let initAttempts = 0;
  const maxAttempts = 5;
  
  function attemptInitialization() {
      if (initAttempts >= maxAttempts) {
          console.warn('Max initialization attempts reached for Swiper');
          return;
      }
      
      initAttempts++;
      console.log(`Swiper initialization attempt ${initAttempts}/${maxAttempts}`);
      
      // Check if Swiper library is available
      if (typeof Swiper === 'undefined') {
          console.log('Swiper library not available, retrying...');
          setTimeout(attemptInitialization, 500);
          return;
      }
      
      setupSwipers();
  }
  
  // Start initialization attempts
  attemptInitialization();
  
  // IMMEDIATE HERO SLIDER VISIBILITY FIX FOR JSDELIVR
  // Force hero sliders to be visible immediately when script loads
  function forceHeroSliderVisibility() {
      const heroSliders = document.querySelectorAll('.hero-slider .swiper.is-hero-slider');
      heroSliders.forEach(slider => {
          // Force visibility with inline styles
          slider.style.opacity = '1';
          slider.style.visibility = 'visible';
          slider.style.display = 'block';
          
          const wrapper = slider.querySelector('.swiper-wrapper');
          if (wrapper) {
              wrapper.style.opacity = '1';
              wrapper.style.visibility = 'visible';
              wrapper.style.display = 'block';
          }
          
          const slides = slider.querySelectorAll('.swiper-slide');
          slides.forEach(slide => {
              slide.style.opacity = '1';
              slide.style.visibility = 'visible';
              slide.style.display = 'block';
          });
          
          console.log('Forced hero slider visibility');
      });
  }
  
  // Run immediately
  forceHeroSliderVisibility();
  
  // Also run after a short delay to catch any late DOM changes
  setTimeout(forceHeroSliderVisibility, 100);
  setTimeout(forceHeroSliderVisibility, 500);

  // Handle mobile browser back/forward cache restores.
  window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
          console.log('Page was restored from bfcache, reinitializing all Swipers.');
          
          // Set flag for restored page
          isPageRestored = true;
          
          // Clear cache and re-run setup to ensure proper initialization
          swiperCache.clear();
          clearDomCache();
          
          // Temporarily disable all transitions to prevent clunky animations
          const allWrappers = document.querySelectorAll('.swiper-wrapper');
          allWrappers.forEach(wrapper => {
              wrapper.style.transition = 'none';
          });
          
          // Small delay to ensure DOM is ready
          setTimeout(() => {
              setupSwipers();
              // Additional easing restoration after setup
              setTimeout(() => {
                  swiperConfigurations.forEach(config => {
                      const swiperElements = cachedQuerySelector(config.selector);
                      swiperElements.forEach(element => {
                          if (element.swiper) {
                              try {
                                  // Force update to restore proper state
                                  element.swiper.update();
                                  
                                  // Re-enable easing by re-applying the easing configuration
                                  if (element.swiper.params && element.swiper.params.easing) {
                                      element.swiper.params.easing = config.options.easing;
                                  }
                                  
                                  // Force a small update to ensure easing is applied
                                  element.swiper.updateSlides();
                                  element.swiper.updateProgress();
                                  
                                  console.log(`Swiper easing restored from bfcache for: ${config.selector}`);
                              } catch (error) {
                                  console.error(`Error restoring Swiper from bfcache for ${config.selector}:`, error);
                              }
                          }
                      });
                  });
                  
                  // Re-enable transitions after everything is set up
                  setTimeout(() => {
                      allWrappers.forEach(wrapper => {
                          wrapper.style.transition = '';
                      });
                  }, 100);
              }, 100);
          }, 50);
      }
  });
  
  // Handle visibility change (when user returns to tab)
  document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
          // When user returns to the tab, restore Swiper functionality
          setTimeout(() => {
              swiperConfigurations.forEach(config => {
                  const swiperElements = cachedQuerySelector(config.selector);
                  swiperElements.forEach(element => {
                      if (element.swiper) {
                          try {
                              // Force update to restore proper state
                              element.swiper.update();
                              
                              // Re-enable easing by re-applying the easing configuration
                              if (element.swiper.params && element.swiper.params.easing) {
                                  element.swiper.params.easing = config.options.easing;
                              }
                              
                              // Force a small update to ensure easing is applied
                              element.swiper.updateSlides();
                              element.swiper.updateProgress();
                              
                              console.log(`Swiper easing restored for: ${config.selector}`);
                          } catch (error) {
                              console.error(`Error restoring Swiper for ${config.selector}:`, error);
                          }
                      }
                  });
              });
          }, 100);
      } else {
          // When page becomes hidden, pause any ongoing animations
          swiperConfigurations.forEach(config => {
              const swiperElements = cachedQuerySelector(config.selector);
              swiperElements.forEach(element => {
                  if (element.swiper && element.swiper.animating) {
                      try {
                          element.swiper.stopAutoplay();
                      } catch (error) {
                          // Ignore errors when stopping autoplay
                      }
                  }
              });
          });
      }
  });
  
  // Additional safeguard for window focus events
  window.addEventListener('focus', () => {
      // When window regains focus, ensure Swiper easing is working
      setTimeout(() => {
          swiperConfigurations.forEach(config => {
              const swiperElements = cachedQuerySelector(config.selector);
              swiperElements.forEach(element => {
                  if (element.swiper) {
                      try {
                          // Re-apply easing configuration
                          if (element.swiper.params && element.swiper.params.easing) {
                              element.swiper.params.easing = config.options.easing;
                          }
                          element.swiper.update();
                      } catch (error) {
                          console.error(`Error restoring Swiper on focus for ${config.selector}:`, error);
                      }
                  }
              });
          });
      }, 50);
  });
  
  // Handle browser back/forward button presses
  window.addEventListener('popstate', () => {
      // When user presses back/forward button, restore Swiper easing
      // Use a longer delay to ensure DOM is fully restored
      setTimeout(() => {
          swiperConfigurations.forEach(config => {
              const swiperElements = cachedQuerySelector(config.selector);
              swiperElements.forEach(element => {
                  if (element.swiper) {
                      try {
                          // Temporarily disable transitions to prevent clunky animations
                          const wrapper = element.querySelector('.swiper-wrapper');
                          if (wrapper) {
                              wrapper.style.transition = 'none';
                          }
                          
                          // Force update to restore proper state
                          element.swiper.update();
                          
                          // Re-enable easing by re-applying the easing configuration
                          if (element.swiper.params && element.swiper.params.easing) {
                              element.swiper.params.easing = config.options.easing;
                          }
                          
                          // Force a small update to ensure easing is applied
                          element.swiper.updateSlides();
                          element.swiper.updateProgress();
                          
                          // Re-enable transitions with a small delay
                          setTimeout(() => {
                              if (wrapper) {
                                  wrapper.style.transition = '';
                              }
                          }, 50);
                          
                          console.log(`Swiper easing restored after popstate for: ${config.selector}`);
                      } catch (error) {
                          console.error(`Error restoring Swiper after popstate for ${config.selector}:`, error);
                      }
                  }
              });
          });
      }, 150);
  });
  
  // Additional handler for back button specifically (for better Chrome compatibility)
  let isBackButtonPressed = false;
  
  // Reset the flag when page loads
  window.addEventListener('load', () => {
      isBackButtonPressed = false;
  });
  
  // Enhanced pageshow handler for back button
  window.addEventListener('pageshow', (event) => {
      if (event.persisted || isBackButtonPressed) {
          console.log('Page was restored from bfcache or back button pressed, optimizing Swiper transitions.');
          
          // Set flag for restored page
          isPageRestored = true;
          
          // Temporarily disable all transitions
          const allWrappers = document.querySelectorAll('.swiper-wrapper');
          allWrappers.forEach(wrapper => {
              wrapper.style.transition = 'none';
          });
          
          // Clear cache and re-run setup
          swiperCache.clear();
          clearDomCache();
          
          setTimeout(() => {
              setupSwipers();
              
              // Restore easing with optimized timing
              setTimeout(() => {
                  swiperConfigurations.forEach(config => {
                      const swiperElements = cachedQuerySelector(config.selector);
                      swiperElements.forEach(element => {
                          if (element.swiper) {
                              try {
                                  // Ensure easing is properly applied
                                  if (element.swiper.params && element.swiper.params.easing) {
                                      element.swiper.params.easing = config.options.easing;
                                  }
                                  
                                  // Update swiper state
                                  element.swiper.update();
                                  element.swiper.updateSlides();
                                  element.swiper.updateProgress();
                                  
                                  console.log(`Swiper optimized after back button for: ${config.selector}`);
                              } catch (error) {
                                  console.error(`Error optimizing Swiper after back button for ${config.selector}:`, error);
                              }
                          }
                      });
                  });
                  
                  // Re-enable transitions with smooth timing
                  setTimeout(() => {
                      allWrappers.forEach(wrapper => {
                          wrapper.style.transition = '';
                      });
                      isBackButtonPressed = false;
                  }, 200);
              }, 150);
          }, 100);
      }
  });

  // Cleanup on page unload to prevent memory leaks and detect back button
  window.addEventListener('beforeunload', () => {
      isBackButtonPressed = true;
      cleanupSwipers();
      // Clear hero slider cache
      heroCachedElements.clear();
  });
  
  // Debounced resize handler for better performance
  const debouncedResizeHandler = debounce(() => {
      // Clear DOM cache on resize
      clearDomCache();
      
      // Re-run setup for flex mode swipers to update mobile sizing
      swiperConfigurations.forEach(config => {
          const swiperElements = cachedQuerySelector(config.selector);
          swiperElements.forEach(swiperEl => {
              if (swiperEl.classList.contains('swiper-flex-mode')) {
                  const wrapperEl = swiperEl.querySelector('.swiper-wrapper');
                  if (wrapperEl) {
                      const slideCount = wrapperEl.querySelectorAll('.swiper-slide').length;
                      const isMobile = window.innerWidth <= 992;
                      
                      // If switching to mobile, reinitialize as Swiper
                      if (isMobile) {
                          // Remove flex mode and initialize Swiper
                          swiperEl.classList.remove('swiper-flex-mode');
                          const swiper = new Swiper(swiperEl, config.options);
                          swiperEl.classList.add('swiper-initialized');
                          
                          // Show navigation elements
                          const navElements = swiperEl.querySelectorAll('.swiper-next, .swiper-prev, .swiper-scrollbar, .slider_arrow');
                          navElements.forEach(el => el.style.display = '');
                          
                          const parentContainer = swiperEl.closest('[data-swiper="best-sellers"], [data-swiper="category"], [data-swiper="offers"]');
                          if (parentContainer) {
                              const paginationContainer = parentContainer.querySelector('.swiper-pagination_elements');
                              if (paginationContainer) {
                                  paginationContainer.style.display = '';
                              }
                          }
                                               } else {
                                                      // Desktop: update slide widths
                            const slides = wrapperEl.querySelectorAll('.swiper-slide');
                            slides.forEach(slide => {
                                // Calculate width based on slide count
                                const slideWidth = slideCount === 3 ? 'calc(33.333% - 15px)' : 'calc(25% - 15px)';
                                slide.style.width = slideWidth;
                                slide.style.flexShrink = '0';
                                slide.style.flexGrow = '0';
                                slide.style.flexBasis = 'auto';
                            });
                       }
                  }
              }
          });
      });
  }, 250); // 250ms debounce delay
  
  // Handle window resize for responsive slide sizing
  window.addEventListener('resize', debouncedResizeHandler);

  // HERO SLIDER - MUTATION OBSERVER FOR DYNAMIC CHANGES
  // -------------------------------------------------------------------
  
  // Watch for any changes to the hero pagination and enforce styles
  const heroPaginationObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' || mutation.type === 'childList') {
        enforceHeroPaginationStyles();
      }
    });
  });

  // Start observing the hero pagination container
  const heroPaginationContainer = document.querySelector('.hero-slider .swiper-pagination');
  if (heroPaginationContainer) {
    heroPaginationObserver.observe(heroPaginationContainer, {
      attributes: true,
      childList: true,
      subtree: true
    });
  }

  // HERO SLIDER - ADDITIONAL INITIALIZATION WITH CONFLICT PREVENTION
  // -------------------------------------------------------------------
  
  // Additional initialization attempt for hero slider after a longer delay
  setTimeout(() => {
    const heroSlider = document.querySelector('.hero-slider .swiper.is-hero-slider');
    if (heroSlider && !heroSlider.swiper) {
      console.log('Delayed hero slider initialization attempt');
      // The hero slider will be initialized through the main setupSwipers function
      // but we can ensure pagination styles are applied
      enforceHeroPaginationStyles();
    }
  }, 2000);

})(); 
