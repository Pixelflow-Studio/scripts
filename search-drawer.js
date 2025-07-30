(function() {
    'use strict';
    
    // Performance optimizations
    const DEBOUNCE_DELAY = 16; // ~60fps
    const ANIMATION_CONFIG = {
        duration: {
            panel: 0.6,
            wrapper: 0.4,
            button: 0.4
        },
        ease: {
            panel: "power3.inOut",
            wrapper: "power2.out"
        }
    };

    // Cached DOM elements
    let cachedElements = null;
    let currentTimeline = null;
    let matchMedia = null;
    let isInitialized = false;
    let typingInterval = null;

    // Utility functions
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function cacheElements() {
        if (cachedElements) return cachedElements;
        
        cachedElements = {
            searchWrapper: document.querySelector('[data-search="wrapper"]'),
            searchInputs: document.querySelectorAll('[data-search="input"]'),
            searchPanel: document.querySelector('[data-search="panel"]'),
            inputCloseButton: document.querySelector('[data-search="close"]'),
            body: document.body,
            searchInput: document.querySelector('#search'),
            smootifySearchInput: document.querySelector('#smootifySearch')
        };

        return cachedElements;
    }

    function validateElements(elements) {
        const { searchWrapper, searchInputs, searchPanel, inputCloseButton, searchInput, smootifySearchInput } = elements;
        
        if (!searchWrapper || !searchInputs.length || !searchPanel || !inputCloseButton) {
            console.error("Required search elements are missing:", {
                wrapper: !!searchWrapper,
                inputs: searchInputs.length > 0,
                panel: !!searchPanel,
                closeButton: !!inputCloseButton
            });
            return false;
        }
        
        if (!searchInput || !smootifySearchInput) {
            console.error("Search input elements are missing:", {
                searchInput: !!searchInput,
                smootifySearchInput: !!smootifySearchInput
            });
            return false;
        }
        
        return true;
    }

    function getScrollbarWidth() {
        // Cache scrollbar width calculation
        if (!getScrollbarWidth.cached) {
            getScrollbarWidth.cached = window.innerWidth - document.documentElement.clientWidth;
        }
        return getScrollbarWidth.cached;
    }

    function simulateTyping(targetInput, text, speed = 50) {
        // Clear any existing typing simulation
        if (typingInterval) {
            clearInterval(typingInterval);
        }
        
        // Clear the target input first
        targetInput.value = '';
        targetInput.focus();
        
        let currentIndex = 0;
        
        typingInterval = setInterval(() => {
            if (currentIndex < text.length) {
                targetInput.value += text[currentIndex];
                // Trigger input event to simulate real typing
                targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                currentIndex++;
            } else {
                clearInterval(typingInterval);
                typingInterval = null;
            }
        }, speed);
    }

    function handleSearchInputChange() {
        const { searchInput, smootifySearchInput } = cachedElements;
        const value = searchInput.value;
        
        // Mirror the value to the smootify search input
        if (value !== smootifySearchInput.value) {
            simulateTyping(smootifySearchInput, value);
        }
        
        // Reset search when input is cleared
        if (value === '') {
            resetSearch();
        }
    }

    function resetSearch() {
        // Clear any active typing simulation
        if (typingInterval) {
            clearInterval(typingInterval);
            typingInterval = null;
        }
        
        // Clear the smootify search input
        const { smootifySearchInput } = cachedElements;
        if (smootifySearchInput) {
            smootifySearchInput.value = '';
            // Trigger input event to notify any search listeners
            smootifySearchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        // Add any additional search reset logic here
        // For example, if you have search results that need to be cleared:
        // clearSearchResults();
        
        console.log('Search has been reset');
    }

    function createTimeline(isMobile = false) {
        const elements = cachedElements;
        const scrollbarWidth = getScrollbarWidth();
        
        const timeline = gsap.timeline({ 
            paused: true,
            onStart() {
                if (!isMobile) {
                    elements.body.style.paddingRight = `${scrollbarWidth}px`;
                }
                elements.body.classList.add("body-no-scroll");
            },
            onReverseComplete() {
                if (!isMobile) {
                    elements.body.style.paddingRight = '';
                }
                elements.body.classList.remove("body-no-scroll");
            }
        });

        // Optimize animations with will-change and transform3d
        timeline
            .set(elements.searchPanel, { willChange: "transform, opacity" })
            .to(elements.searchPanel, { 
                yPercent: 0, 
                opacity: 1, 
                visibility: "visible", 
                duration: ANIMATION_CONFIG.duration.panel,
                ease: ANIMATION_CONFIG.ease.panel,
                force3D: true
            })
            .to(elements.inputCloseButton, { 
                opacity: 1, 
                visibility: 'visible', 
                duration: ANIMATION_CONFIG.duration.button 
            }, 0);

        if (!isMobile) {
            timeline
                .set(elements.searchWrapper, { willChange: "width" }, 0)
                .to(elements.searchWrapper, { 
                    width: "15rem", 
                    duration: ANIMATION_CONFIG.duration.wrapper,
                    ease: ANIMATION_CONFIG.ease.wrapper
                }, 0);
        }

        // Clean up will-change after animation
        timeline.call(() => {
            elements.searchPanel.style.willChange = 'auto';
            if (!isMobile) {
                elements.searchWrapper.style.willChange = 'auto';
            }
        });

        return timeline;
    }

    function handleInputClick() {
        if (currentTimeline && !currentTimeline.isActive()) {
            currentTimeline.play();
        }
    }

    function handleCloseClick() {
        if (currentTimeline && !currentTimeline.isActive()) {
            currentTimeline.reverse();
        }
    }

    // Optimized outside click handler with event delegation
    const handleOutsideClick = debounce((event) => {
        if (!currentTimeline || currentTimeline.progress() === 0 || currentTimeline.isActive()) {
            return;
        }

        const { searchWrapper, searchPanel } = cachedElements;
        
        if (!searchWrapper.contains(event.target) && !searchPanel.contains(event.target)) {
            currentTimeline.reverse();
        }
    }, DEBOUNCE_DELAY);

    function setupEventListeners() {
        const { searchInputs, inputCloseButton, searchInput } = cachedElements;
        
        // Use event delegation for inputs if possible, otherwise individual listeners
        searchInputs.forEach(input => {
            input.addEventListener("click", handleInputClick, { passive: true });
        });
        
        inputCloseButton.addEventListener("click", handleCloseClick, { passive: true });
        document.addEventListener("click", handleOutsideClick, { passive: true });
        
        // Add input change listener for search input mirroring
        searchInput.addEventListener("input", handleSearchInputChange, { passive: true });
    }

    function cleanup() {
        if (matchMedia) {
            matchMedia.kill();
            matchMedia = null;
        }
        
        if (currentTimeline) {
            currentTimeline.kill();
            currentTimeline = null;
        }

        // Clear any active typing simulation
        if (typingInterval) {
            clearInterval(typingInterval);
            typingInterval = null;
        }

        // Remove event listeners
        const { searchInputs, inputCloseButton, searchInput } = cachedElements || {};
        if (searchInputs) {
            searchInputs.forEach(input => {
                input.removeEventListener("click", handleInputClick);
            });
        }
        
        if (inputCloseButton) {
            inputCloseButton.removeEventListener("click", handleCloseClick);
        }
        
        if (searchInput) {
            searchInput.removeEventListener("input", handleSearchInputChange);
        }
        
        document.removeEventListener("click", handleOutsideClick);
        
        isInitialized = false;
    }

    function initializeSearchDrawer() {
        if (isInitialized) return;
        
        const elements = cacheElements();
        if (!validateElements(elements)) return;

        // Set initial states efficiently
        gsap.set(elements.inputCloseButton, { opacity: 0, visibility: 'hidden' });
        gsap.set(elements.searchPanel, { yPercent: 100 });

        matchMedia = gsap.matchMedia();

        // Desktop setup
        matchMedia.add("(min-width: 992px)", () => {
            currentTimeline = createTimeline(false);
            setupEventListeners();
            
            return () => {
                if (currentTimeline) {
                    currentTimeline.kill();
                }
            };
        });

        // Mobile setup
        matchMedia.add("(max-width: 991px)", () => {
            currentTimeline = createTimeline(true);
            setupEventListeners();
            
            return () => {
                if (currentTimeline) {
                    currentTimeline.kill();
                }
            };
        });

        isInitialized = true;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSearchDrawer, { once: true });
    } else {
        initializeSearchDrawer();
    }

    // Expose cleanup function for potential manual cleanup
    window.smootifySearchDrawer = {
        cleanup,
        reinitialize: () => {
            cleanup();
            initializeSearchDrawer();
        }
    };

})();
