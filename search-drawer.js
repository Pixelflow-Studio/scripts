(function() {
    'use strict';
    
    // Configuration object for easy customization
    const CONFIG = {
        // Performance settings
        DEBOUNCE_DELAY: 16, // ~60fps
        TYPING_SPEED: 50,
        
        // Animation settings
        ANIMATION: {
            duration: {
                panel: 0.6,
                wrapper: 0.4,
                button: 0.4
            },
            ease: {
                panel: "power3.inOut",
                wrapper: "power2.out"
            }
        },
        
        // Breakpoints
        BREAKPOINTS: {
            mobile: 991,
            desktop: 992
        },
        
        // Selectors
        SELECTORS: {
            searchWrapper: '[data-search="wrapper"]',
            searchInputs: '[data-search="input"]',
            searchPanel: '[data-search="panel"]',
            inputCloseButton: '[data-search="close"]',
            searchInput: '#search',
            smootifySearchInput: '#smootifySearch'
        },
        
        // Accessibility
        ACCESSIBILITY: {
            enableKeyboardNavigation: true,
            enableScreenReaderSupport: true,
            focusTrapEnabled: true
        }
    };

    // State management
    const state = {
        cachedElements: null,
        currentTimeline: null,
        matchMedia: null,
        isInitialized: false,
        typingInterval: null,
        isOpen: false,
        focusTrap: null,
        originalActiveElement: null
    };

    // Error handling utility
    function handleError(error, context) {
        console.error(`[SearchDrawer] Error in ${context}:`, error);
        
        // In production, you might want to send this to an error tracking service
        if (typeof window.gtag !== 'undefined') {
            window.gtag('event', 'exception', {
                description: `SearchDrawer: ${context} - ${error.message}`,
                fatal: false
            });
        }
    }

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

    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    function cacheElements() {
        if (state.cachedElements) return state.cachedElements;
        
        try {
            state.cachedElements = {
                searchWrapper: document.querySelector(CONFIG.SELECTORS.searchWrapper),
                searchInputs: document.querySelectorAll(CONFIG.SELECTORS.searchInputs),
                searchPanel: document.querySelector(CONFIG.SELECTORS.searchPanel),
                inputCloseButton: document.querySelector(CONFIG.SELECTORS.inputCloseButton),
                body: document.body,
                searchInput: document.querySelector(CONFIG.SELECTORS.searchInput),
                smootifySearchInput: document.querySelector(CONFIG.SELECTORS.smootifySearchInput)
            };

            return state.cachedElements;
        } catch (error) {
            handleError(error, 'cacheElements');
            return null;
        }
    }

    function validateElements(elements) {
        if (!elements) return false;
        
        const { searchWrapper, searchInputs, searchPanel, inputCloseButton, searchInput, smootifySearchInput } = elements;
        
        const requiredElements = {
            wrapper: searchWrapper,
            inputs: searchInputs?.length > 0,
            panel: searchPanel,
            closeButton: inputCloseButton,
            searchInput: searchInput,
            smootifySearchInput: smootifySearchInput
        };
        
        const missingElements = Object.entries(requiredElements)
            .filter(([key, value]) => !value)
            .map(([key]) => key);
        
        if (missingElements.length > 0) {
            console.error("[SearchDrawer] Required elements missing:", missingElements);
            return false;
        }
        
        return true;
    }

    function getScrollbarWidth() {
        if (!getScrollbarWidth.cached) {
            try {
                getScrollbarWidth.cached = window.innerWidth - document.documentElement.clientWidth;
            } catch (error) {
                handleError(error, 'getScrollbarWidth');
                getScrollbarWidth.cached = 0;
            }
        }
        return getScrollbarWidth.cached;
    }

    function simulateTyping(targetInput, text, speed = CONFIG.TYPING_SPEED) {
        if (!targetInput || typeof text !== 'string') return;
        
        // Clear any existing typing simulation
        if (state.typingInterval) {
            clearInterval(state.typingInterval);
        }
        
        try {
            // Clear the target input first
            targetInput.value = '';
            targetInput.focus();
            
            let currentIndex = 0;
            
            state.typingInterval = setInterval(() => {
                if (currentIndex < text.length) {
                    targetInput.value += text[currentIndex];
                    // Trigger input event to simulate real typing
                    targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                    currentIndex++;
                } else {
                    clearInterval(state.typingInterval);
                    state.typingInterval = null;
                }
            }, speed);
        } catch (error) {
            handleError(error, 'simulateTyping');
        }
    }

    function handleSearchInputChange() {
        try {
            const { searchInput, smootifySearchInput } = state.cachedElements;
            if (!searchInput || !smootifySearchInput) return;
            
            const value = searchInput.value;
            
            // Mirror the value to the smootify search input
            if (value !== smootifySearchInput.value) {
                simulateTyping(smootifySearchInput, value);
            }
            
            // Reset search when input is cleared
            if (value === '') {
                resetSearch();
            }
        } catch (error) {
            handleError(error, 'handleSearchInputChange');
        }
    }

    function resetSearch() {
        try {
            // Clear any active typing simulation
            if (state.typingInterval) {
                clearInterval(state.typingInterval);
                state.typingInterval = null;
            }
            
            // Clear the smootify search input
            const { smootifySearchInput } = state.cachedElements;
            if (smootifySearchInput) {
                smootifySearchInput.value = '';
                // Trigger input event to notify any search listeners
                smootifySearchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            console.log('[SearchDrawer] Search has been reset');
        } catch (error) {
            handleError(error, 'resetSearch');
        }
    }

    // Accessibility functions
    function setupAccessibility() {
        if (!CONFIG.ACCESSIBILITY.enableScreenReaderSupport) return;
        
        try {
            const { searchPanel, inputCloseButton, searchInput } = state.cachedElements;
            
            // Add ARIA attributes
            if (searchPanel) {
                searchPanel.setAttribute('role', 'dialog');
                searchPanel.setAttribute('aria-modal', 'true');
                searchPanel.setAttribute('aria-label', 'Search panel');
            }
            
            if (inputCloseButton) {
                inputCloseButton.setAttribute('aria-label', 'Close search');
            }
            
            if (searchInput) {
                searchInput.setAttribute('aria-expanded', 'false');
            }
        } catch (error) {
            handleError(error, 'setupAccessibility');
        }
    }

    function updateAccessibilityState(isOpen) {
        try {
            const { searchInput, searchPanel } = state.cachedElements;
            
            if (searchInput) {
                searchInput.setAttribute('aria-expanded', isOpen.toString());
            }
            
            if (searchPanel) {
                searchPanel.setAttribute('aria-hidden', (!isOpen).toString());
            }
        } catch (error) {
            handleError(error, 'updateAccessibilityState');
        }
    }

    function setupFocusTrap() {
        if (!CONFIG.ACCESSIBILITY.focusTrapEnabled) return;
        
        try {
            const { searchPanel, inputCloseButton, searchInput } = state.cachedElements;
            const focusableElements = searchPanel.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            state.focusTrap = (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
            };
            
            searchPanel.addEventListener('keydown', state.focusTrap);
        } catch (error) {
            handleError(error, 'setupFocusTrap');
        }
    }

    function removeFocusTrap() {
        if (state.focusTrap) {
            try {
                const { searchPanel } = state.cachedElements;
                searchPanel.removeEventListener('keydown', state.focusTrap);
                state.focusTrap = null;
            } catch (error) {
                handleError(error, 'removeFocusTrap');
            }
        }
    }

    function createTimeline(isMobile = false) {
        try {
            const elements = state.cachedElements;
            const scrollbarWidth = getScrollbarWidth();
            
            const timeline = gsap.timeline({ 
                paused: true,
                onStart() {
                    try {
                        if (!isMobile) {
                            elements.body.style.paddingRight = `${scrollbarWidth}px`;
                        }
                        elements.body.classList.add("body-no-scroll");
                        state.isOpen = true;
                        updateAccessibilityState(true);
                        
                        // Store original active element for restoration
                        state.originalActiveElement = document.activeElement;
                        
                        // Focus the search input
                        if (elements.searchInput) {
                            elements.searchInput.focus();
                        }
                        
                        setupFocusTrap();
                    } catch (error) {
                        handleError(error, 'timeline onStart');
                    }
                },
                onReverseComplete() {
                    try {
                        if (!isMobile) {
                            elements.body.style.paddingRight = '';
                        }
                        elements.body.classList.remove("body-no-scroll");
                        state.isOpen = false;
                        updateAccessibilityState(false);
                        
                        // Restore focus to original element
                        if (state.originalActiveElement && state.originalActiveElement.focus) {
                            state.originalActiveElement.focus();
                        }
                        
                        removeFocusTrap();
                    } catch (error) {
                        handleError(error, 'timeline onReverseComplete');
                    }
                }
            });

            // Optimize animations with will-change and transform3d
            timeline
                .set(elements.searchPanel, { willChange: "transform, opacity" })
                .to(elements.searchPanel, { 
                    yPercent: 0, 
                    opacity: 1, 
                    visibility: "visible", 
                    duration: CONFIG.ANIMATION.duration.panel,
                    ease: CONFIG.ANIMATION.ease.panel,
                    force3D: true
                })
                .to(elements.inputCloseButton, { 
                    opacity: 1, 
                    visibility: 'visible', 
                    duration: CONFIG.ANIMATION.duration.button 
                }, 0);

            if (!isMobile) {
                timeline
                    .set(elements.searchWrapper, { willChange: "width" }, 0)
                    .to(elements.searchWrapper, { 
                        width: "15rem", 
                        duration: CONFIG.ANIMATION.duration.wrapper,
                        ease: CONFIG.ANIMATION.ease.wrapper
                    }, 0);
            }

            // Clean up will-change after animation
            timeline.call(() => {
                try {
                    elements.searchPanel.style.willChange = 'auto';
                    if (!isMobile) {
                        elements.searchWrapper.style.willChange = 'auto';
                    }
                } catch (error) {
                    handleError(error, 'timeline cleanup');
                }
            });

            return timeline;
        } catch (error) {
            handleError(error, 'createTimeline');
            return null;
        }
    }

    function handleInputClick() {
        try {
            if (state.currentTimeline && !state.currentTimeline.isActive()) {
                state.currentTimeline.play();
            }
        } catch (error) {
            handleError(error, 'handleInputClick');
        }
    }

    function handleCloseClick() {
        try {
            if (state.currentTimeline && !state.currentTimeline.isActive()) {
                state.currentTimeline.reverse();
            }
        } catch (error) {
            handleError(error, 'handleCloseClick');
        }
    }

    function handleKeydown(event) {
        if (!CONFIG.ACCESSIBILITY.enableKeyboardNavigation) return;
        
        try {
            // Close on Escape key
            if (event.key === 'Escape' && state.isOpen) {
                event.preventDefault();
                handleCloseClick();
            }
        } catch (error) {
            handleError(error, 'handleKeydown');
        }
    }

    // Optimized outside click handler with event delegation
    const handleOutsideClick = debounce((event) => {
        try {
            if (!state.currentTimeline || state.currentTimeline.progress() === 0 || state.currentTimeline.isActive()) {
                return;
            }

            const { searchWrapper, searchPanel } = state.cachedElements;
            
            if (!searchWrapper.contains(event.target) && !searchPanel.contains(event.target)) {
                state.currentTimeline.reverse();
            }
        } catch (error) {
            handleError(error, 'handleOutsideClick');
        }
    }, CONFIG.DEBOUNCE_DELAY);

    function setupEventListeners() {
        try {
            const { searchInputs, inputCloseButton, searchInput } = state.cachedElements;
            
            // Use event delegation for inputs if possible, otherwise individual listeners
            searchInputs.forEach(input => {
                input.addEventListener("click", handleInputClick, { passive: true });
            });
            
            inputCloseButton.addEventListener("click", handleCloseClick, { passive: true });
            document.addEventListener("click", handleOutsideClick, { passive: true });
            document.addEventListener("keydown", handleKeydown, { passive: true });
            
            // Add input change listener for search input mirroring
            searchInput.addEventListener("input", handleSearchInputChange, { passive: true });
        } catch (error) {
            handleError(error, 'setupEventListeners');
        }
    }

    function cleanup() {
        try {
            if (state.matchMedia) {
                state.matchMedia.kill();
                state.matchMedia = null;
            }
            
            if (state.currentTimeline) {
                state.currentTimeline.kill();
                state.currentTimeline = null;
            }

            // Clear any active typing simulation
            if (state.typingInterval) {
                clearInterval(state.typingInterval);
                state.typingInterval = null;
            }

            // Remove event listeners
            const { searchInputs, inputCloseButton, searchInput } = state.cachedElements || {};
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
            document.removeEventListener("keydown", handleKeydown);
            
            removeFocusTrap();
            
            state.isInitialized = false;
            state.isOpen = false;
            state.cachedElements = null;
        } catch (error) {
            handleError(error, 'cleanup');
        }
    }

    function initializeSearchDrawer() {
        if (state.isInitialized) return;
        
        try {
            const elements = cacheElements();
            if (!validateElements(elements)) {
                console.warn('[SearchDrawer] Initialization skipped due to missing elements');
                return;
            }

            // Set initial states efficiently
            gsap.set(elements.inputCloseButton, { opacity: 0, visibility: 'hidden' });
            gsap.set(elements.searchPanel, { yPercent: 100 });

            // Setup accessibility
            setupAccessibility();

            state.matchMedia = gsap.matchMedia();

            // Desktop setup
            state.matchMedia.add(`(min-width: ${CONFIG.BREAKPOINTS.desktop}px)`, () => {
                state.currentTimeline = createTimeline(false);
                setupEventListeners();
                
                return () => {
                    if (state.currentTimeline) {
                        state.currentTimeline.kill();
                    }
                };
            });

            // Mobile setup
            state.matchMedia.add(`(max-width: ${CONFIG.BREAKPOINTS.mobile}px)`, () => {
                state.currentTimeline = createTimeline(true);
                setupEventListeners();
                
                return () => {
                    if (state.currentTimeline) {
                        state.currentTimeline.kill();
                    }
                };
            });

            state.isInitialized = true;
            console.log('[SearchDrawer] Initialized successfully');
        } catch (error) {
            handleError(error, 'initializeSearchDrawer');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSearchDrawer, { once: true });
    } else {
        initializeSearchDrawer();
    }

    // Expose API for external control
    window.smootifySearchDrawer = {
        // Core functions
        cleanup,
        reinitialize: () => {
            cleanup();
            initializeSearchDrawer();
        },
        
        // State management
        isOpen: () => state.isOpen,
        isInitialized: () => state.isInitialized,
        
        // Control functions
        open: () => {
            if (state.currentTimeline && !state.currentTimeline.isActive()) {
                state.currentTimeline.play();
            }
        },
        close: () => {
            if (state.currentTimeline && !state.currentTimeline.isActive()) {
                state.currentTimeline.reverse();
            }
        },
        
        // Configuration
        updateConfig: (newConfig) => {
            Object.assign(CONFIG, newConfig);
        },
        
        // Utility functions
        resetSearch,
        simulateTyping: (text, speed) => {
            const { smootifySearchInput } = state.cachedElements || {};
            if (smootifySearchInput) {
                simulateTyping(smootifySearchInput, text, speed);
            }
        }
    };

})();
