

(function() {
    'use strict';

    // ===================================================================
    // CONFIGURATION & CONSTANTS
    // ===================================================================
    
    const CONFIG = {
        // Performance settings
        DEBOUNCE_DELAY: 250,
        LOW_END_MEMORY_THRESHOLD: 4,
        LOW_END_CPU_THRESHOLD: 4,
        ANIMATION_SPEED: {
            NORMAL: 600,
            OPTIMIZED: 400
        },
        
        // Responsive breakpoints
        BREAKPOINTS: {
            MOBILE: 480,
            TABLET: 768,
            DESKTOP: 992
        },
        
        // Swiper configurations
        SWIPER_CONFIGS: [
            {
                name: 'category',
                selector: '[data-swiper="category"] .swiper',
                options: {
                    slidesPerView: 5.5,
                    spaceBetween: 20,
                    loop: false,
                    speed: null, // Will be set dynamically
                    easing: null, // Will be set dynamically
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
                name: 'best-sellers',
                selector: '[data-swiper="best-sellers"] .swiper',
                options: {
                    slidesPerView: 4.5,
                    spaceBetween: 20,
                    loop: false,
                    speed: null,
                    easing: null,
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
                name: 'tanning',
                selector: '[data-swiper="tanning"] .swiper',
                options: {
                    slidesPerView: 3,
                    spaceBetween: 20,
                    loop: false,
                    speed: null,
                    easing: null,
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
                name: 'offers',
                selector: '[data-swiper="offers"] .swiper',
                options: {
                    slidesPerView: 3,
                    spaceBetween: 20,
                    loop: false,
                    speed: null,
                    easing: null,
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
            }
        ],
        
        // Easing presets
        EASING_PRESETS: {
            fast: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
            smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
            bouncy: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            'ease-out': 'ease-out',
            'ease-in-out': 'ease-in-out',
            linear: 'linear'
        },
        
        // Error messages
        ERRORS: {
            SWIPER_NOT_LOADED: 'Swiper library not loaded. Skipping initialization.',
            NO_WRAPPER: 'No .swiper-wrapper found for selector:',
            INITIALIZATION_FAILED: 'Failed to initialize Swiper for',
            UPDATE_FAILED: 'Failed to update Swiper for',
            DESTROY_FAILED: 'Failed to destroy Swiper for'
        }
    };

    // ===================================================================
    // UTILITY FUNCTIONS
    // ===================================================================
    
    /**
     * Performance detection utilities
     */
    const PerformanceUtils = {
        /**
         * Detects if the current device is low-end
         * @returns {boolean}
         */
        isLowEndDevice() {
            // Check for low memory devices
            if (navigator.deviceMemory && navigator.deviceMemory < CONFIG.LOW_END_MEMORY_THRESHOLD) {
                return true;
            }
            
            // Check for slow CPU
            if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < CONFIG.LOW_END_CPU_THRESHOLD) {
                return true;
            }
            
            // Check for slow connection
            if (navigator.connection) {
                const connection = navigator.connection;
                if (['slow-2g', '2g', '3g'].includes(connection.effectiveType)) {
                    return true;
                }
            }
            
            // Check for reduced motion preference
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                return true;
            }
            
            return false;
        },

        /**
         * Gets optimized animation speed based on device capabilities
         * @returns {number}
         */
        getOptimizedSpeed() {
            return this.isLowEndDevice() ? CONFIG.ANIMATION_SPEED.OPTIMIZED : CONFIG.ANIMATION_SPEED.NORMAL;
        },

        /**
         * Gets optimized easing function based on device and configuration
         * @param {HTMLElement} swiperEl - The swiper element
         * @returns {string}
         */
        getOptimizedEasing(swiperEl) {
            if (this.isLowEndDevice()) {
                return 'ease-out';
            }
            
            const easingType = swiperEl.getAttribute('data-swiper-easing-type');
            if (easingType && CONFIG.EASING_PRESETS[easingType]) {
                return CONFIG.EASING_PRESETS[easingType];
            }
            
            return CONFIG.EASING_PRESETS.smooth;
        }
    };

    /**
     * Debounce utility function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function}
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Safe error logging with environment detection
     * @param {string} message - Error message
     * @param {Error} error - Error object
     * @param {string} context - Context where error occurred
     */
    function logError(message, error = null, context = '') {
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' ||
                             window.location.protocol === 'file:';
        
        if (isDevelopment) {
            console.error(`[Swiper Initializer${context ? ` - ${context}` : ''}]`, message, error);
        } else {
            // In production, log to external service or use a more sophisticated logging system
            console.warn(`[Swiper Initializer] ${message}`);
            
            // Example: Send to error tracking service
            // if (window.Sentry) {
            //     window.Sentry.captureException(error || new Error(message));
            // }
        }
    }

    // ===================================================================
    // CACHE MANAGEMENT
    // ===================================================================
    
    const CacheManager = {
        swiperCache: new Map(),
        domCache: new Map(),
        isPageRestored: false,
        isInitializing: false,

        /**
         * Cached DOM query function
         * @param {string} selector - CSS selector
         * @returns {NodeList}
         */
        cachedQuerySelector(selector) {
            if (!this.domCache.has(selector)) {
                this.domCache.set(selector, document.querySelectorAll(selector));
            }
            return this.domCache.get(selector);
        },

        /**
         * Clear DOM cache
         */
        clearDomCache() {
            this.domCache.clear();
        },

        /**
         * Clear all caches
         */
        clearAll() {
            this.swiperCache.clear();
            this.domCache.clear();
        },

        /**
         * Generate cache key for swiper element
         * @param {string} selector - Swiper selector
         * @param {HTMLElement} element - Swiper element
         * @returns {string}
         */
        generateCacheKey(selector, element) {
            return `${selector}-${element.dataset.swiperId || element.id || element.className}`;
        }
    };

    // ===================================================================
    // STYLE MANAGEMENT
    // ===================================================================
    
    const StyleManager = {
        /**
         * Inject required CSS styles
         */
        injectStyles() {
            if (document.getElementById('swiper-hide-styles')) {
                return; // Styles already injected
            }

            const style = document.createElement('style');
            style.id = 'swiper-hide-styles';
            style.textContent = `
                /* Swiper visibility management */
                .swiper-restored .swiper:not(.swiper-ready) {
                    opacity: 0 !important;
                    visibility: hidden !important;
                    transition: opacity 0.3s ease, visibility 0.3s ease;
                }
                
                .swiper-restored .swiper.swiper-ready {
                    opacity: 1 !important;
                    visibility: visible !important;
                }
                
                .swiper-js-loaded:not(.swiper-restored) .swiper {
                    opacity: 1 !important;
                    visibility: visible !important;
                }
                
                .swiper-js-loaded .swiper:not(.swiper-initialized):not(.swiper-flex-mode) .swiper-wrapper {
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .swiper-js-loaded .swiper.swiper-initialized .swiper-wrapper,
                .swiper-js-loaded .swiper.swiper-flex-mode .swiper-wrapper {
                    opacity: 1;
                }
                
                /* Performance optimizations */
                .swiper-low-end-device .swiper-wrapper {
                    will-change: auto;
                }
                
                .swiper-low-end-device .swiper-slide {
                    will-change: auto;
                }
                
                /* Smooth transitions */
                .swiper-restored .swiper-wrapper {
                    transition: opacity 0.5s ease-in-out !important;
                }
                
                /* Prevent flash during transitions */
                .swiper {
                    min-height: 200px;
                    transition: opacity 0.3s ease;
                }
                
                /* Loading states */
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
    };

    // ===================================================================
    // SWIPER MANAGEMENT
    // ===================================================================
    
    const SwiperManager = {
        /**
         * Initialize or update a single swiper
         * @param {Object} config - Swiper configuration
         * @param {HTMLElement} swiperEl - Swiper element
         */
        initOrUpdateSwiper(config, swiperEl) {
            try {
                const wrapperEl = swiperEl.querySelector('.swiper-wrapper');
                if (!wrapperEl) {
                    logError(`${CONFIG.ERRORS.NO_WRAPPER} ${config.selector}`, null, 'Initialization');
                    return;
                }

                const cacheKey = CacheManager.generateCacheKey(config.selector, swiperEl);
                const cachedData = CacheManager.swiperCache.get(cacheKey);
                const slideCount = wrapperEl.querySelectorAll('.swiper-slide').length;
                
                const needsReinit = !cachedData || 
                                   cachedData.slideCount !== slideCount ||
                                   !swiperEl.swiper;
                
                if (needsReinit) {
                    this.destroySwiper(swiperEl);
                    
                    if (slideCount > 0) {
                        this.initializeSwiper(config, swiperEl, wrapperEl, slideCount);
                        
                        // Cache the new state
                        CacheManager.swiperCache.set(cacheKey, {
                            slideCount: slideCount,
                            timestamp: Date.now(),
                            config: config.selector
                        });
                    }
                } else if (swiperEl.swiper) {
                    this.updateSwiper(swiperEl);
                }
            } catch (error) {
                logError(`${CONFIG.ERRORS.INITIALIZATION_FAILED} ${config.selector}`, error, 'Initialization');
                this.markAsReady(swiperEl);
            }
        },

        /**
         * Initialize a new swiper instance
         * @param {Object} config - Swiper configuration
         * @param {HTMLElement} swiperEl - Swiper element
         * @param {HTMLElement} wrapperEl - Wrapper element
         * @param {number} slideCount - Number of slides
         */
        initializeSwiper(config, swiperEl, wrapperEl, slideCount) {
            const isMobile = window.innerWidth <= CONFIG.BREAKPOINTS.DESKTOP;
            
            if (slideCount <= 4 && !isMobile) {
                this.setupFlexMode(swiperEl, wrapperEl, slideCount);
            } else {
                this.setupSwiperMode(config, swiperEl);
            }
        },

        /**
         * Setup flex mode for desktop with few slides
         * @param {HTMLElement} swiperEl - Swiper element
         * @param {HTMLElement} wrapperEl - Wrapper element
         * @param {number} slideCount - Number of slides
         */
        setupFlexMode(swiperEl, wrapperEl, slideCount) {
            swiperEl.classList.remove('swiper-initialized');
            swiperEl.classList.add('swiper-flex-mode');
            
            wrapperEl.style.display = '';
            wrapperEl.style.gap = '20px';
            
            // Set slide widths
            const slides = wrapperEl.querySelectorAll('.swiper-slide');
            const slideWidth = slideCount === 3 ? 'calc(33.333% - 15px)' : 'calc(25% - 15px)';
            
            slides.forEach(slide => {
                slide.style.width = slideWidth;
                slide.style.flexShrink = '0';
                slide.style.flexGrow = '0';
                slide.style.flexBasis = 'auto';
            });
            
            // Hide navigation elements
            this.toggleNavigationElements(swiperEl, false);
            
            this.markAsReady(swiperEl);
        },

        /**
         * Setup swiper mode with Swiper.js
         * @param {Object} config - Swiper configuration
         * @param {HTMLElement} swiperEl - Swiper element
         */
        setupSwiperMode(config, swiperEl) {
            const options = {
                ...config.options,
                speed: PerformanceUtils.getOptimizedSpeed(),
                easing: PerformanceUtils.getOptimizedEasing(swiperEl)
            };
            
            const swiper = new Swiper(swiperEl, options);
            
            // Force updates to ensure proper initialization
            swiper.update();
            swiper.updateSlides();
            swiper.updateProgress();
            
            swiperEl.classList.add('swiper-initialized');
            this.toggleNavigationElements(swiperEl, true);
            this.markAsReady(swiperEl);
        },

        /**
         * Toggle navigation elements visibility
         * @param {HTMLElement} swiperEl - Swiper element
         * @param {boolean} show - Whether to show or hide elements
         */
        toggleNavigationElements(swiperEl, show) {
            const navElements = swiperEl.querySelectorAll('.swiper-next, .swiper-prev, .swiper-scrollbar, .slider_arrow');
            navElements.forEach(el => {
                el.style.display = show ? '' : 'none';
            });
            
            const parentContainer = swiperEl.closest('[data-swiper]');
            if (parentContainer) {
                const paginationContainer = parentContainer.querySelector('.swiper-pagination_elements');
                if (paginationContainer) {
                    paginationContainer.style.display = show ? '' : 'none';
                }
            }
        },

        /**
         * Mark swiper as ready
         * @param {HTMLElement} swiperEl - Swiper element
         */
        markAsReady(swiperEl) {
            if (CacheManager.isPageRestored) {
                swiperEl.classList.add('swiper-ready');
            }
        },

        /**
         * Update existing swiper
         * @param {HTMLElement} swiperEl - Swiper element
         */
        updateSwiper(swiperEl) {
            try {
                swiperEl.swiper.update();
                swiperEl.classList.add('swiper-initialized');
                this.markAsReady(swiperEl);
            } catch (error) {
                logError(`${CONFIG.ERRORS.UPDATE_FAILED} ${swiperEl.className}`, error, 'Update');
            }
        },

        /**
         * Destroy swiper instance
         * @param {HTMLElement} swiperEl - Swiper element
         */
        destroySwiper(swiperEl) {
            if (swiperEl.swiper) {
                try {
                    swiperEl.swiper.destroy(true, true);
                } catch (error) {
                    logError(`${CONFIG.ERRORS.DESTROY_FAILED} ${swiperEl.className}`, error, 'Destroy');
                }
            }
        },

        /**
         * Update all swipers on page show
         */
        updateAllSwipers() {
            CONFIG.SWIPER_CONFIGS.forEach(config => {
                const swiperElements = CacheManager.cachedQuerySelector(config.selector);
                swiperElements.forEach(element => {
                    if (element.swiper) {
                        try {
                            element.swiper.update();
                            
                            if (element.swiper.params && element.swiper.params.easing) {
                                element.swiper.params.easing = config.options.easing;
                            }
                            
                            element.swiper.updateSlides();
                            element.swiper.updateProgress();
                            
                            const cacheKey = CacheManager.generateCacheKey(config.selector, element);
                            const cachedData = CacheManager.swiperCache.get(cacheKey);
                            if (cachedData) {
                                cachedData.timestamp = Date.now();
                            }
                        } catch (error) {
                            logError(`${CONFIG.ERRORS.UPDATE_FAILED} ${config.selector}`, error, 'Update All');
                        }
                    }
                });
            });
        },

        /**
         * Cleanup all swipers
         */
        cleanup() {
            CONFIG.SWIPER_CONFIGS.forEach(config => {
                const swiperElements = CacheManager.cachedQuerySelector(config.selector);
                swiperElements.forEach(element => {
                    if (element._swiperObserver) {
                        element._swiperObserver.disconnect();
                        delete element._swiperObserver;
                    }
                    
                    this.destroySwiper(element);
                });
            });
            
            CacheManager.clearAll();
        }
    };

    // ===================================================================
    // MAIN INITIALIZATION FUNCTION
    // ===================================================================
    
    function setupSwipers() {
        // Check if Swiper is available
        if (typeof Swiper === 'undefined') {
            logError(CONFIG.ERRORS.SWIPER_NOT_LOADED, null, 'Setup');
            return;
        }
        
        // Prevent multiple simultaneous initializations
        if (CacheManager.isInitializing) {
            return;
        }
        
        CacheManager.isInitializing = true;
        
        try {
            // Add body classes
            document.body.classList.add('swiper-js-loaded');
            
            if (PerformanceUtils.isLowEndDevice()) {
                document.body.classList.add('swiper-low-end-device');
            }
            
            if (CacheManager.isPageRestored) {
                document.body.classList.add('swiper-restored');
            }
            
            // Inject styles
            StyleManager.injectStyles();
            
            // Handle restored pages
            if (CacheManager.isPageRestored) {
                const allSwipers = document.querySelectorAll('.swiper');
                allSwipers.forEach(swiperEl => {
                    swiperEl.classList.remove('swiper-ready');
                    const wrapperEl = swiperEl.querySelector('.swiper-wrapper');
                    if (wrapperEl) {
                        wrapperEl.style.opacity = '1';
                        wrapperEl.style.transition = 'opacity 0.5s ease-in-out';
                    }
                });
            }
            
            // Initialize all swipers
            CONFIG.SWIPER_CONFIGS.forEach(config => {
                const swiperElements = CacheManager.cachedQuerySelector(config.selector);
                
                if (swiperElements.length === 0) {
                    return;
                }
                
                swiperElements.forEach(swiperEl => {
                    const wrapperEl = swiperEl.querySelector('.swiper-wrapper');
                    if (!wrapperEl) {
                        return;
                    }
                    
                    // Initialize swiper
                    SwiperManager.initOrUpdateSwiper(config, swiperEl);
                    
                    // Set up mutation observer
                    const observer = new MutationObserver(() => {
                        SwiperManager.initOrUpdateSwiper(config, swiperEl);
                    });
                    
                    observer.observe(wrapperEl, { childList: true });
                    swiperEl._swiperObserver = observer;
                });
            });
            
            // Remove restored class after initialization
            if (CacheManager.isPageRestored) {
                setTimeout(() => {
                    document.body.classList.remove('swiper-restored');
                    CacheManager.isPageRestored = false;
                }, 1000);
            }
            
        } catch (error) {
            logError('Failed to setup swipers', error, 'Setup');
        } finally {
            CacheManager.isInitializing = false;
        }
    }

    // ===================================================================
    // EVENT HANDLERS
    // ===================================================================
    
    // Debounced resize handler
    const debouncedResizeHandler = debounce(() => {
        CacheManager.clearDomCache();
        
        CONFIG.SWIPER_CONFIGS.forEach(config => {
            const swiperElements = CacheManager.cachedQuerySelector(config.selector);
            swiperElements.forEach(swiperEl => {
                if (swiperEl.classList.contains('swiper-flex-mode')) {
                    const wrapperEl = swiperEl.querySelector('.swiper-wrapper');
                    if (wrapperEl) {
                        const slideCount = wrapperEl.querySelectorAll('.swiper-slide').length;
                        const isMobile = window.innerWidth <= CONFIG.BREAKPOINTS.DESKTOP;
                        
                        if (isMobile) {
                            // Switch to swiper mode on mobile
                            swiperEl.classList.remove('swiper-flex-mode');
                            SwiperManager.setupSwiperMode(config, swiperEl);
                        } else {
                            // Update flex mode on desktop
                            const slides = wrapperEl.querySelectorAll('.swiper-slide');
                            const slideWidth = slideCount === 3 ? 'calc(33.333% - 15px)' : 'calc(25% - 15px)';
                            slides.forEach(slide => {
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
    }, CONFIG.DEBOUNCE_DELAY);

    // ===================================================================
    // EVENT LISTENERS
    // ===================================================================
    
    // DOM ready
    document.addEventListener('DOMContentLoaded', setupSwipers);
    
    // Window load
    window.addEventListener('load', () => {
        setTimeout(setupSwipers, 100);
    });
    
    // Page show (back/forward cache)
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            CacheManager.isPageRestored = true;
            CacheManager.clearAll();
            
            const allWrappers = document.querySelectorAll('.swiper-wrapper');
            allWrappers.forEach(wrapper => {
                wrapper.style.transition = 'none';
            });
            
            setTimeout(() => {
                setupSwipers();
                setTimeout(() => {
                    SwiperManager.updateAllSwipers();
                    setTimeout(() => {
                        allWrappers.forEach(wrapper => {
                            wrapper.style.transition = '';
                        });
                    }, 100);
                }, 100);
            }, 50);
        }
    });
    
    // Visibility change
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            setTimeout(() => {
                SwiperManager.updateAllSwipers();
            }, 100);
        } else {
            // Pause animations when page is hidden
            CONFIG.SWIPER_CONFIGS.forEach(config => {
                const swiperElements = CacheManager.cachedQuerySelector(config.selector);
                swiperElements.forEach(element => {
                    if (element.swiper && element.swiper.animating) {
                        try {
                            element.swiper.stopAutoplay();
                        } catch (error) {
                            // Ignore autoplay stop errors
                        }
                    }
                });
            });
        }
    });
    
    // Window focus
    window.addEventListener('focus', () => {
        setTimeout(() => {
            SwiperManager.updateAllSwipers();
        }, 50);
    });
    
    // Popstate (back/forward navigation)
    window.addEventListener('popstate', () => {
        setTimeout(() => {
            CONFIG.SWIPER_CONFIGS.forEach(config => {
                const swiperElements = CacheManager.cachedQuerySelector(config.selector);
                swiperElements.forEach(element => {
                    if (element.swiper) {
                        try {
                            const wrapper = element.querySelector('.swiper-wrapper');
                            if (wrapper) {
                                wrapper.style.transition = 'none';
                            }
                            
                            element.swiper.update();
                            
                            if (element.swiper.params && element.swiper.params.easing) {
                                element.swiper.params.easing = config.options.easing;
                            }
                            
                            element.swiper.updateSlides();
                            element.swiper.updateProgress();
                            
                            setTimeout(() => {
                                if (wrapper) {
                                    wrapper.style.transition = '';
                                }
                            }, 50);
                        } catch (error) {
                            logError(`Error restoring Swiper after popstate for ${config.selector}`, error, 'Popstate');
                        }
                    }
                });
            });
        }, 150);
    });
    
    // Before unload
    window.addEventListener('beforeunload', () => {
        SwiperManager.cleanup();
    });
    
    // Resize
    window.addEventListener('resize', debouncedResizeHandler);

    // ===================================================================
    // PUBLIC API (for external access if needed)
    // ===================================================================
    
    // Expose public methods for external use
    window.SwiperInitializer = {
        setup: setupSwipers,
        update: SwiperManager.updateAllSwipers,
        cleanup: SwiperManager.cleanup,
        isLowEndDevice: PerformanceUtils.isLowEndDevice,
        config: CONFIG
    };

})(); 
