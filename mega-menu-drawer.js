(function() {
    'use strict';
    
    // Check if already initialized to prevent duplicate execution
    if (window.megaMenuInitialized) {
        return;
    }
    
    // ============================================================================
    // CONFIGURATION - Easy to customize for other developers
    // ============================================================================
    const CONFIG = {
        // CSS Selectors - Update these to match your HTML structure
        selectors: {
            component: '[data-menu="component"]',
            backdrop: '[data-menu="backdrop"]',
            mainPanel: '[data-menu="main-panel"]',
            contentToSlide: '[data-menu="content-to-slide"]',
            open: '[data-menu="open"]',
            close: '[data-menu="close"]',
            openSub: '[data-menu="open-sub"]',
            back: '[data-menu="back"]',
            subPanel: '[data-menu="sub-panel"]',
            navLinks: '.mega-menu-nav-link'
        },
        
        // Animation settings
        animation: {
            duration: 0.4,
            ease: 'power2.out',
            closeEase: 'power2.in',
            stagger: 0.05,
            navLinkDelay: 0.2
        },
        
        // Performance settings
        performance: {
            debounceDelay: 150,
            maxInitAttempts: 10,
            initRetryInterval: 500,
            flashPreventionDelay: 100
        }
    };
    
    // ============================================================================
    // PERFORMANCE OPTIMIZATIONS
    // ============================================================================
    
    // Cache DOM queries
    const domCache = {
        elements: new Map(),
        get: function(selector) {
            if (!this.elements.has(selector)) {
                this.elements.set(selector, document.querySelector(selector));
            }
            return this.elements.get(selector);
        },
        getAll: function(selector) {
            const cacheKey = selector + '_all';
            if (!this.elements.has(cacheKey)) {
                this.elements.set(cacheKey, document.querySelectorAll(selector));
            }
            return this.elements.get(cacheKey);
        },
        clear: function() {
            this.elements.clear();
        }
    };
    
    // Debounced function utility
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
    
    // Throttled function utility
    const throttle = (func, limit) => {
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
    };
    
    // ============================================================================
    // IMMEDIATE FLASH PREVENTION
    // ============================================================================
    
    // Immediately hide any open menu using inline styles to prevent flash
    (function() {
        const style = document.createElement('style');
        style.textContent = `
            ${CONFIG.selectors.component} { pointer-events: none !important; }
            ${CONFIG.selectors.mainPanel} { transform: translateX(-100%) !important; }
            ${CONFIG.selectors.backdrop} { opacity: 0 !important; }
        `;
        document.head.appendChild(style);
        
        // Remove the style after a short delay to allow normal operation
        setTimeout(() => {
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, CONFIG.performance.flashPreventionDelay);
    })();
    
    // ============================================================================
    // GLOBAL STATE MANAGEMENT
    // ============================================================================
    
    // Global variables to track initialization state
    let isInitialized = false;
    let eventListenersAttached = false;

    // Global variables for menu state
    let sidebarComponent, backdrop, mainSidebar, contentToSlide, primaryNavLinks;
    let cachedScrollbarWidth = null;
    let resizeTimeout;
    let currentTimeline = null;
    let panelStack = [];
    let originalParents = new Map();
    let isAnimating = false;

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================
    
    const getBodyScrollbarWidth = () => {
        if (cachedScrollbarWidth === null) {
            cachedScrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        }
        return cachedScrollbarWidth;
    };

    const handleResize = debounce(() => {
        cachedScrollbarWidth = null;
        domCache.clear(); // Clear cache on resize
    }, CONFIG.performance.debounceDelay);

    const killCurrentTimeline = () => {
        if (currentTimeline) {
            currentTimeline.kill();
            currentTimeline = null;
        }
    };

    // ============================================================================
    // ANIMATION AND CONTROL FUNCTIONS
    // ============================================================================
    
    const resetSubNavs = () => {
        requestAnimationFrame(() => {
            originalParents.forEach((parent, child) => {
                if (parent && child) {
                    parent.appendChild(child);
                    gsap.set(child, { x: '100%', visibility: 'hidden', pointerEvents: 'none' });
                }
            });
            originalParents.clear();
            
            gsap.set(contentToSlide, { x: '0%' });
            panelStack.length = 0;
            
            const subPanels = domCache.getAll(CONFIG.selectors.subPanel);
            subPanels.forEach(panel => {
                gsap.set(panel, { x: '100%', visibility: 'hidden', pointerEvents: 'none' });
            });
        });
    };

    const openMenu = () => {
        if (isAnimating) {
            killCurrentTimeline();
            isAnimating = false;
        }

        gsap.set(sidebarComponent, { pointerEvents: 'auto' });
        gsap.set(mainSidebar, { x: '-100%' });
        gsap.set(backdrop, { opacity: 0 });
        gsap.set(primaryNavLinks, { opacity: 0, y: 20 });

        isAnimating = true;
        killCurrentTimeline();
        
        panelStack.length = 0;
        panelStack.push(contentToSlide);
        
        const scrollbarWidth = getBodyScrollbarWidth();
        const bodyStyle = document.body.style;
        bodyStyle.paddingRight = `${scrollbarWidth}px`;
        bodyStyle.overflow = 'hidden';

        currentTimeline = gsap.timeline({ 
            onComplete: () => { 
                isAnimating = false;
                currentTimeline = null;
            }
        });
        
        currentTimeline
            .set(sidebarComponent, { pointerEvents: 'auto' })
            .to(backdrop, { opacity: 1, duration: CONFIG.animation.duration }, "<")
            .to(mainSidebar, { x: '0%', duration: CONFIG.animation.duration, ease: CONFIG.animation.ease }, "<")
            .to(primaryNavLinks, {
                duration: CONFIG.animation.duration * 0.75,
                opacity: 1,
                y: 0,
                stagger: CONFIG.animation.stagger,
                ease: 'power1.out'
            }, `-=${CONFIG.animation.navLinkDelay}`);
    };

    const closeMenu = (instant = false) => {
        killCurrentTimeline();
        isAnimating = true;

        if (instant) {
            // Close immediately without animation
            resetSubNavs();
            gsap.set(sidebarComponent, { pointerEvents: 'none' });
            gsap.set(mainSidebar, { x: '-100%' });
            gsap.set(backdrop, { opacity: 0 });
            gsap.set(primaryNavLinks, { opacity: 0, y: 20 }); 
            const bodyStyle = document.body.style;
            bodyStyle.paddingRight = '';
            bodyStyle.overflow = '';
            isAnimating = false;
            currentTimeline = null;
        } else {
            // Close with animation
            currentTimeline = gsap.timeline({
                onComplete: () => {
                    resetSubNavs();
                    gsap.set(sidebarComponent, { pointerEvents: 'none' });
                    gsap.set(primaryNavLinks, { opacity: 0, y: 20 }); 
                    const bodyStyle = document.body.style;
                    bodyStyle.paddingRight = '';
                    bodyStyle.overflow = '';
                    isAnimating = false;
                    currentTimeline = null;
                }
            });
            
            currentTimeline
                .to(backdrop, { opacity: 0, duration: CONFIG.animation.duration, ease: CONFIG.animation.closeEase })
                .to(mainSidebar, { x: '-100%', duration: CONFIG.animation.duration, ease: CONFIG.animation.closeEase }, "<");
        }
    };

    // ============================================================================
    // EVENT HANDLERS (OPTIMIZED)
    // ============================================================================
    
    const handleGlobalClick = (event) => {
        const target = event.target;
        
        if (target.closest(CONFIG.selectors.open)) {
            event.preventDefault();
            openMenu();
            return;
        }
        
        if (target.closest(CONFIG.selectors.close)) {
            event.preventDefault();
            closeMenu(false);
            return;
        }
        
        // Close menu when clicking on external navigation links (not sub-menu items)
        if (target.closest('a[href]') && 
            !target.closest(CONFIG.selectors.open) && 
            !target.closest(CONFIG.selectors.close) && 
            !target.closest(CONFIG.selectors.openSub) &&
            !target.closest(CONFIG.selectors.back)) {
            
            // Prevent the default navigation
            event.preventDefault();
            
            // Close menu immediately without animation
            closeMenu(true);
            
            // Get the href and navigate immediately
            const link = target.closest('a[href]');
            const href = link.getAttribute('href');
            
            // Navigate immediately since menu is already closed
            window.location.href = href;
        }
    };

    const handlePanelNavigation = (event) => {
        const target = event.target;
        const openLink = target.closest(CONFIG.selectors.openSub);
        const backButton = target.closest(CONFIG.selectors.back);

        if (openLink) {
            event.preventDefault();
            
            const parentItem = openLink.closest('.w-dyn-item');
            if (!parentItem) return;
            
            const nextPanel = parentItem.querySelector(CONFIG.selectors.subPanel);
            if (!nextPanel || isAnimating) return;
            
            isAnimating = true;
            killCurrentTimeline();
            
            const currentPanel = panelStack[panelStack.length - 1];
            originalParents.set(nextPanel, nextPanel.parentElement);
            mainSidebar.appendChild(nextPanel);
            panelStack.push(nextPanel);

            currentTimeline = gsap.timeline({
                onComplete: () => {
                    isAnimating = false;
                    currentTimeline = null;
                }
            });
            
            currentTimeline
                .to(currentPanel, { x: '-100%', duration: CONFIG.animation.duration, ease: 'power2.inOut' })
                .to(nextPanel, { x: '0%', visibility: 'visible', pointerEvents: 'auto', duration: CONFIG.animation.duration, ease: 'power2.inOut' }, "<");
        }
        
        if (backButton) {
            event.preventDefault();
            
            if (panelStack.length <= 1 || isAnimating) return;
            
            isAnimating = true;
            killCurrentTimeline();
            
            const panelToClose = panelStack.pop();
            const panelToReveal = panelStack[panelStack.length - 1];
            const originalParent = originalParents.get(panelToClose);

            currentTimeline = gsap.timeline({
                onComplete: () => {
                    if (originalParent) {
                        originalParent.appendChild(panelToClose);
                        originalParents.delete(panelToClose);
                    }
                    isAnimating = false;
                    currentTimeline = null;
                }
            });
            
            currentTimeline
                .to(panelToReveal, { x: '0%', duration: CONFIG.animation.duration, ease: 'power2.inOut' })
                .to(panelToClose, { x: '100%', pointerEvents: 'none', duration: CONFIG.animation.duration, ease: 'power2.inOut' }, "<");
        }
    };

    const handlePopState = () => {
        // Detach existing listeners first
        detachEventListeners();
        
        // Reset initialization state to allow re-initialization
        isInitialized = false;
        
        // Force close any open menu first
        if (sidebarComponent && mainSidebar) {
            gsap.set(sidebarComponent, { pointerEvents: 'none' });
            gsap.set(mainSidebar, { x: '-100%' });
            if (backdrop) gsap.set(backdrop, { opacity: 0 });
            if (primaryNavLinks) gsap.set(primaryNavLinks, { opacity: 0, y: 20 });
            
            // Reset body styles
            const bodyStyle = document.body.style;
            bodyStyle.paddingRight = '';
            bodyStyle.overflow = '';
        }
        
        // Re-initialize after a short delay to ensure DOM is ready
        setTimeout(() => {
            initializeMenu();
            attachEventListeners();
        }, CONFIG.performance.flashPreventionDelay);
    };

    // ============================================================================
    // INITIALIZATION FUNCTIONS
    // ============================================================================
    
    const initializeMenuState = () => {
        gsap.set(sidebarComponent, { pointerEvents: 'none' });
        gsap.set(mainSidebar, { x: '-100%' });
        gsap.set(backdrop, { opacity: 0 });
        gsap.set(primaryNavLinks, { opacity: 0, y: 20 });
        
        killCurrentTimeline();
        isAnimating = false;
        panelStack.length = 0;
        originalParents.clear();
        resetSubNavs();
        
        const bodyStyle = document.body.style;
        bodyStyle.paddingRight = '';
        bodyStyle.overflow = '';
    };

    const initializeMenu = () => {
        // Check if GSAP is available
        if (typeof gsap === 'undefined') {
            return false;
        }
        
        // Element selection using cached queries
        sidebarComponent = domCache.get(CONFIG.selectors.component);
        backdrop = domCache.get(CONFIG.selectors.backdrop);
        mainSidebar = domCache.get(CONFIG.selectors.mainPanel);
        contentToSlide = domCache.get(CONFIG.selectors.contentToSlide);
        
        if (!sidebarComponent || !mainSidebar || !contentToSlide) {
            return false;
        }
        
        const allNavLinks = contentToSlide.querySelectorAll(CONFIG.selectors.navLinks);
        primaryNavLinks = Array.from(allNavLinks).filter(link => !link.closest(CONFIG.selectors.subPanel));
        
        if (primaryNavLinks.length === 0) {
            return false;
        }
      
        gsap.set(primaryNavLinks, { opacity: 0, y: 20 });
        
        // Initialize menu state
        initializeMenuState();
        
        // Force close menu in case it was left open
        gsap.set(sidebarComponent, { pointerEvents: 'none' });
        gsap.set(mainSidebar, { x: '-100%' });
        gsap.set(backdrop, { opacity: 0 });
        gsap.set(primaryNavLinks, { opacity: 0, y: 20 });
        
        // Reset body styles
        const bodyStyle = document.body.style;
        bodyStyle.paddingRight = '';
        bodyStyle.overflow = '';
        
        isInitialized = true;
        return true;
    };

    const attachEventListeners = () => {
        // Always detach first to ensure clean state
        detachEventListeners();

        if (!mainSidebar || !backdrop) {
            return;
        }

        document.addEventListener('click', handleGlobalClick, { passive: false });
        mainSidebar.addEventListener('click', handlePanelNavigation, { passive: false });
        backdrop.addEventListener('click', () => closeMenu(false), { passive: true });
        window.addEventListener('resize', handleResize, { passive: true });
        window.addEventListener('popstate', handlePopState);

        eventListenersAttached = true;
    };

    const detachEventListeners = () => {
        // Always try to remove listeners, even if not marked as attached
        document.removeEventListener('click', handleGlobalClick);
        if (mainSidebar) {
            mainSidebar.removeEventListener('click', handlePanelNavigation);
        }
        if (backdrop) {
            backdrop.removeEventListener('click', closeMenu);
        }

        window.removeEventListener('resize', handleResize);
        window.removeEventListener('popstate', handlePopState);

        eventListenersAttached = false;
    };

    // ============================================================================
    // INITIALIZATION TRIGGERS
    // ============================================================================
    
    const attemptInitialization = () => {
        if (initializeMenu()) {
            attachEventListeners();
            return true;
        }
        return false;
    };

    // Hide menu immediately using CSS to prevent flash
    const hideMenuImmediately = () => {
        const sidebarComponent = domCache.get(CONFIG.selectors.component);
        const mainSidebar = domCache.get(CONFIG.selectors.mainPanel);
        const backdrop = domCache.get(CONFIG.selectors.backdrop);
        
        if (sidebarComponent) {
            sidebarComponent.style.pointerEvents = 'none';
        }
        if (mainSidebar) {
            mainSidebar.style.transform = 'translateX(-100%)';
        }
        if (backdrop) {
            backdrop.style.opacity = '0';
        }
        
        // Reset body styles
        document.body.style.paddingRight = '';
        document.body.style.overflow = '';
    };

    // Hide menu immediately without waiting for GSAP
    hideMenuImmediately();

    document.addEventListener("DOMContentLoaded", () => {
        attemptInitialization();
    });

    // Also initialize if DOM is already loaded (for browser back/forward)
    if (document.readyState === 'loading') {
        // DOM is still loading, wait for DOMContentLoaded
    } else {
        // DOM is already loaded, initialize immediately
        attemptInitialization();
    }

    // Handle page visibility changes (for when user returns to tab)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !isInitialized) {
            setTimeout(() => {
                attemptInitialization();
            }, CONFIG.performance.flashPreventionDelay);
        }
    });

    // Additional event listener for pageshow event (better for browser navigation)
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            setTimeout(() => {
                // Force close any open menu first
                if (sidebarComponent && mainSidebar) {
                    gsap.set(sidebarComponent, { pointerEvents: 'none' });
                    gsap.set(mainSidebar, { x: '-100%' });
                    if (backdrop) gsap.set(backdrop, { opacity: 0 });
                    if (primaryNavLinks) gsap.set(primaryNavLinks, { opacity: 0, y: 20 });
                    
                    // Reset body styles
                    const bodyStyle = document.body.style;
                    bodyStyle.paddingRight = '';
                    bodyStyle.overflow = '';
                }
                
                detachEventListeners();
                isInitialized = false;
                attemptInitialization();
            }, CONFIG.performance.flashPreventionDelay);
        }
    });

    // Additional fallback: try initialization periodically if not successful
    let initAttempts = 0;
    const initInterval = setInterval(() => {
        if (isInitialized || initAttempts >= CONFIG.performance.maxInitAttempts) {
            clearInterval(initInterval);
            return;
        }
        
        if (attemptInitialization()) {
            clearInterval(initInterval);
        }
        initAttempts++;
    }, CONFIG.performance.initRetryInterval);

    // ============================================================================
    // CLEANUP
    // ============================================================================
    
    window.addEventListener('beforeunload', () => {
        clearTimeout(resizeTimeout);
        killCurrentTimeline();
        detachEventListeners();
    });

    // Mark as initialized globally
    window.megaMenuInitialized = true;
})();
