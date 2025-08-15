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
              return;
          }
          
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
                              // If 4 or fewer slides, only use flex mode on desktop
                              const isMobile = window.innerWidth <= 768;
                              
                              if (slideCount <= 4 && !isMobile) {
                                  // Desktop: Remove swiper classes and show slides normally
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
                                  // Mobile OR more than 4 slides: Initialize swiper normally
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
                                  
                                  // Show navigation and scrollbar elements
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
                                  
                                  // Mark as ready and show (only for restored pages)
                                  if (isPageRestored) {
                                      swiperEl.classList.add('swiper-ready');
                                  }
                                  
                                  console.log(`Swiper initialized for: ${config.selector} - ${slideCount} slides`);
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

})(); 
