/**
 * ===================================================================
 * CUSTOM SMOOTIFY WEBFLOW SLIDER - PRODUCTION READY
 * ===================================================================
 * 
 * A high-performance, production-ready slider implementation for Webflow
 * with Smootify integration. Features include:
 * - Optimized thumbnail synchronization
 * - Desktop scrubbing functionality
 * - Memory leak prevention
 * - Comprehensive error handling
 * - Performance optimizations
 * 
 * @version 2.0.0
 * @author Your Name
 * @license MIT
 */

(function() {
  'use strict';

  // Configuration object for easy customization
  const CONFIG = {
    SELECTORS: {
      SLIDER: '.media-gallery_thumbnails',
      PRODUCT_WRAPPER: 'smootify-product',
      WEBFLOW_SLIDER: '.media-slider.w-slider',
      ACTIVE_THUMBNAIL: '.media-gallery_thumbnail-image.active',
      THUMBNAILS: '.media-gallery_thumbnail-image',
      DOTS: '.w-slider-dot',
      ACTIVE_DOT: '.w-slider-dot.w-active'
    },
    BREAKPOINTS: {
      DESKTOP: 991
    },
    TIMING: {
      VARIANT_CHANGE_DELAY: 100,
      RESIZE_THROTTLE: 100,
      MOUSE_MOVE_THROTTLE: 16 // ~60fps
    },
    SCROLL_OPTIONS: {
      BEHAVIOR: 'smooth',
      BLOCK: 'nearest',
      INLINE: 'nearest'
    }
  };

  // Main Slider class for better organization
  class SmootifySlider {
    constructor() {
      this.elements = {};
      this.state = {
        isDown: false,
        startY: 0,
        scrollTop: 0,
        lastActiveIndex: -1,
        isInitialized: false
      };
      this.timers = {
        scrollTimeout: null,
        resizeTimeout: null,
        mouseMoveThrottle: null
      };
      this.observers = {
        sliderObserver: null
      };
      this.boundHandlers = {
        onMouseDown: this.onMouseDown.bind(this),
        onMouseMove: this.onMouseMove.bind(this),
        onMouseUp: this.onMouseUp.bind(this),
        onResize: this.setupDesktopScrubbing.bind(this),
        onVariantChange: this.handleVariantChange.bind(this)
      };
    }

    /**
     * Initialize the slider
     * @returns {boolean} Success status
     */
    init() {
      try {
        if (this.state.isInitialized) {
          console.warn('Slider already initialized');
          return true;
        }

        if (!this.cacheElements()) {
          return false;
        }

        this.setupEventListeners();
        this.setupMutationObserver();
        this.setupDesktopScrubbing();
        this.preventImageDragging();
        this.scrollActiveThumbnailIntoView();

        this.state.isInitialized = true;
        console.log('SmootifySlider initialized successfully');
        return true;

      } catch (error) {
        console.error('Failed to initialize SmootifySlider:', error);
        return false;
      }
    }

    /**
     * Cache DOM elements for performance
     * @returns {boolean} Success status
     */
    cacheElements() {
      try {
        this.elements.slider = document.querySelector(CONFIG.SELECTORS.SLIDER);
        this.elements.productWrapper = document.querySelector(CONFIG.SELECTORS.PRODUCT_WRAPPER);
        this.elements.webflowSlider = document.querySelector(CONFIG.SELECTORS.WEBFLOW_SLIDER);

        if (!this.elements.slider || !this.elements.productWrapper || !this.elements.webflowSlider) {
          console.error('Required elements not found:', {
            slider: !!this.elements.slider,
            productWrapper: !!this.elements.productWrapper,
            webflowSlider: !!this.elements.webflowSlider
          });
          return false;
        }

        return true;

      } catch (error) {
        console.error('Error caching elements:', error);
        return false;
      }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
      try {
        // Variant change handler
        this.elements.productWrapper.addEventListener('changeVariant', this.boundHandlers.onVariantChange);
        
        // Resize handler
        window.addEventListener('resize', this.boundHandlers.onResize, { passive: true });

      } catch (error) {
        console.error('Error setting up event listeners:', error);
      }
    }

    /**
     * Setup mutation observer for slider changes
     */
    setupMutationObserver() {
      try {
        this.observers.sliderObserver = new MutationObserver(() => {
          this.syncThumbnailsToSlider();
        });

        this.observers.sliderObserver.observe(this.elements.webflowSlider, {
          attributes: true,
          attributeFilter: ['class'],
          subtree: true
        });

      } catch (error) {
        console.error('Error setting up mutation observer:', error);
      }
    }

    /**
     * Handle variant changes
     * @param {Event} event - Variant change event
     */
    handleVariantChange(event) {
      try {
        const variant = event.detail;
        console.log('Variant changed:', variant);
        
        // Debounce the sync to avoid multiple rapid updates
        if (this.timers.scrollTimeout) {
          clearTimeout(this.timers.scrollTimeout);
        }
        
        this.timers.scrollTimeout = setTimeout(() => {
          this.syncThumbnailsToSlider();
        }, CONFIG.TIMING.VARIANT_CHANGE_DELAY);

      } catch (error) {
        console.error('Error handling variant change:', error);
      }
    }

    /**
     * Scroll active thumbnail into view
     */
    scrollActiveThumbnailIntoView() {
      try {
        const activeThumbnail = this.elements.slider.querySelector(CONFIG.SELECTORS.ACTIVE_THUMBNAIL);
        if (activeThumbnail) {
          activeThumbnail.scrollIntoView(CONFIG.SCROLL_OPTIONS);
        }
      } catch (error) {
        console.error('Error scrolling active thumbnail:', error);
      }
    }

    /**
     * Sync thumbnails to slider state
     */
    syncThumbnailsToSlider() {
      try {
        const allDots = Array.from(this.elements.webflowSlider.querySelectorAll(CONFIG.SELECTORS.DOTS));
        const allThumbnails = this.elements.slider.querySelectorAll(CONFIG.SELECTORS.THUMBNAILS);

        const activeIndex = allDots.findIndex(dot => 
          dot.classList.contains('w-active')
        );

        if (activeIndex !== -1 && activeIndex !== this.state.lastActiveIndex) {
          const targetThumbnail = allThumbnails[activeIndex];
          
          if (targetThumbnail) {
            // Remove active from all thumbnails
            allThumbnails.forEach(thumb => {
              thumb.classList.remove('active');
            });
            
            // Add active to target thumbnail
            targetThumbnail.classList.add('active');
            
            // Update last active index
            this.state.lastActiveIndex = activeIndex;
            
            // Scroll it into view
            this.scrollActiveThumbnailIntoView();
          }
        }

      } catch (error) {
        console.error('Error syncing thumbnails:', error);
      }
    }

    /**
     * Setup desktop scrubbing functionality
     */
    setupDesktopScrubbing() {
      try {
        if (this.timers.resizeTimeout) {
          clearTimeout(this.timers.resizeTimeout);
        }

        this.timers.resizeTimeout = setTimeout(() => {
          const isDesktop = window.innerWidth > CONFIG.BREAKPOINTS.DESKTOP;
          
          if (isDesktop) {
            this.elements.slider.addEventListener('mousedown', this.boundHandlers.onMouseDown);
          } else {
            this.elements.slider.removeEventListener('mousedown', this.boundHandlers.onMouseDown);
            // Clean up any active scrubbing state
            if (this.state.isDown) {
              this.onMouseUp();
            }
          }
        }, CONFIG.TIMING.RESIZE_THROTTLE);

      } catch (error) {
        console.error('Error setting up desktop scrubbing:', error);
      }
    }

    /**
     * Handle mouse down event for scrubbing
     * @param {MouseEvent} e - Mouse event
     */
    onMouseDown(e) {
      try {
        this.state.isDown = true;
        this.state.startY = e.pageY - this.elements.slider.offsetTop;
        this.state.scrollTop = this.elements.slider.scrollTop;
        
        this.elements.slider.classList.add('active-scrub');
        
        window.addEventListener('mousemove', this.boundHandlers.onMouseMove, { passive: false });
        window.addEventListener('mouseup', this.boundHandlers.onMouseUp, { passive: true });

      } catch (error) {
        console.error('Error in mouse down handler:', error);
      }
    }

    /**
     * Handle mouse move event for scrubbing
     * @param {MouseEvent} e - Mouse event
     */
    onMouseMove(e) {
      try {
        if (!this.state.isDown) return;
        
        // Throttle mouse move for better performance
        if (this.timers.mouseMoveThrottle) return;
        
        this.timers.mouseMoveThrottle = requestAnimationFrame(() => {
          e.preventDefault();
          const y = e.pageY - this.elements.slider.offsetTop;
          const walkY = (y - this.state.startY) * 2;
          this.elements.slider.scrollTop = this.state.scrollTop - walkY;
          this.timers.mouseMoveThrottle = null;
        });

      } catch (error) {
        console.error('Error in mouse move handler:', error);
      }
    }

    /**
     * Handle mouse up event for scrubbing
     */
    onMouseUp() {
      try {
        this.state.isDown = false;
        this.elements.slider.classList.remove('active-scrub');
        
        window.removeEventListener('mousemove', this.boundHandlers.onMouseMove);
        window.removeEventListener('mouseup', this.boundHandlers.onMouseUp);
        
        if (this.timers.mouseMoveThrottle) {
          cancelAnimationFrame(this.timers.mouseMoveThrottle);
          this.timers.mouseMoveThrottle = null;
        }

      } catch (error) {
        console.error('Error in mouse up handler:', error);
      }
    }

    /**
     * Prevent image dragging
     */
    preventImageDragging() {
      try {
        const images = this.elements.slider.querySelectorAll('img');
        images.forEach(img => {
          img.draggable = false;
        });
        
        this.elements.slider.addEventListener('dragstart', e => e.preventDefault());

      } catch (error) {
        console.error('Error preventing image dragging:', error);
      }
    }

    /**
     * Clean up resources and event listeners
     */
    destroy() {
      try {
        // Clear all timers
        Object.values(this.timers).forEach(timer => {
          if (timer) {
            if (typeof timer === 'number') {
              clearTimeout(timer);
            } else if (timer) {
              cancelAnimationFrame(timer);
            }
          }
        });

        // Disconnect observers
        if (this.observers.sliderObserver) {
          this.observers.sliderObserver.disconnect();
        }

        // Remove event listeners
        if (this.elements.productWrapper) {
          this.elements.productWrapper.removeEventListener('changeVariant', this.boundHandlers.onVariantChange);
        }
        
        window.removeEventListener('resize', this.boundHandlers.onResize);
        
        if (this.elements.slider) {
          this.elements.slider.removeEventListener('mousedown', this.boundHandlers.onMouseDown);
        }

        // Reset state
        this.state.isInitialized = false;
        this.state.isDown = false;

        console.log('SmootifySlider destroyed successfully');

      } catch (error) {
        console.error('Error destroying SmootifySlider:', error);
      }
    }
  }

  // Global instance
  let sliderInstance = null;

  // Initialize when Smootify is loaded
  document.addEventListener('smootify:product_loaded', (event) => {
    try {
      console.log('Smootify loaded. Initializing production-ready slider...');
      
      // Clean up any existing instance
      if (sliderInstance) {
        sliderInstance.destroy();
      }
      
      // Create and initialize new instance
      sliderInstance = new SmootifySlider();
      const success = sliderInstance.init();
      
      if (!success) {
        console.error('Failed to initialize slider');
      }

    } catch (error) {
      console.error('Error in smootify:product_loaded handler:', error);
    }
  });

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (sliderInstance) {
      sliderInstance.destroy();
      sliderInstance = null;
    }
  });

})();
