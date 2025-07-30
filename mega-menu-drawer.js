document.addEventListener("DOMContentLoaded", () => {
    // --- 1. ELEMENT SELECTION & CACHING ---
    const sidebarComponent = document.querySelector('[data-menu="component"]');
    const backdrop = document.querySelector('[data-menu="backdrop"]');
    const mainSidebar = document.querySelector('[data-menu="main-panel"]');
    const contentToSlide = document.querySelector('[data-menu="content-to-slide"]');
    
    // Early return if critical elements are missing
    if (!sidebarComponent || !mainSidebar || !contentToSlide) {
        console.error("Mega Menu Error: Critical data-attribute targets are missing.");
        return;
    }
    
    // Cache all nav links and filter primary links
    const allNavLinks = contentToSlide.querySelectorAll('.mega-menu-nav-link');
    const primaryNavLinks = Array.from(allNavLinks).filter(link => !link.closest('[data-menu="sub-panel"]'));
    
    if (primaryNavLinks.length === 0) {
        console.error("Mega Menu Error: No primary navigation links found.");
        return;
    }

    // Initialize nav links with starting animation state
    gsap.set(primaryNavLinks, { opacity: 0, y: 20 });

    // --- 2. PERFORMANCE OPTIMIZATIONS ---
    // Cache scrollbar width calculation
    let cachedScrollbarWidth = null;
    const getBodyScrollbarWidth = () => {
        if (cachedScrollbarWidth === null) {
            cachedScrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        }
        return cachedScrollbarWidth;
    };

    // Recalculate scrollbar width on resize (debounced)
    let resizeTimeout;
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            cachedScrollbarWidth = null;
        }, 150);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Reusable timeline for better memory management
    let currentTimeline = null;
    const killCurrentTimeline = () => {
        if (currentTimeline) {
            currentTimeline.kill();
            currentTimeline = null;
        }
    };

    // --- 3. STATE MANAGEMENT ---
    const panelStack = [];
    const originalParents = new Map();
    let isAnimating = false;

    // --- 4. ANIMATION AND CONTROL FUNCTIONS ---
    const resetSubNavs = () => {
        // Use requestAnimationFrame for better performance
        requestAnimationFrame(() => {
            originalParents.forEach((parent, child) => {
                parent.appendChild(child);
                gsap.set(child, { x: '100%', visibility: 'hidden', pointerEvents: 'none' });
            });
            originalParents.clear();
            gsap.set(contentToSlide, { x: '0%' });
            panelStack.length = 0;
        });
    };
      
    const openMenu = () => {
        if (isAnimating) return;
        isAnimating = true;

        killCurrentTimeline();
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
            .to(backdrop, { opacity: 1, duration: 0.4 }, "<")
            .to(mainSidebar, { x: '0%', duration: 0.4, ease: 'power2.out' }, "<")
            .to(primaryNavLinks, {
                duration: 0.3,
                opacity: 1,
                y: 0,
                stagger: 0.05,
                ease: 'power1.out'
            }, "-=0.2");
    };

    const closeMenu = () => {
        // Allow closing even during animation - just kill current timeline
        killCurrentTimeline();
        isAnimating = true;

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
            .to(backdrop, { opacity: 0, duration: 0.4, ease: 'power2.in' })
            .to(mainSidebar, { x: '-100%', duration: 0.4, ease: 'power2.in' }, "<");
    };

    // --- 5. OPTIMIZED EVENT LISTENERS ---
    // Use event delegation for better performance
    const handleGlobalClick = (event) => {
        const target = event.target;
        
        // Check for menu open/close triggers
        if (target.closest('[data-menu="open"]')) {
            event.preventDefault();
            openMenu();
            return;
        }
        
        if (target.closest('[data-menu="close"]')) {
            event.preventDefault();
            closeMenu();
            return;
        }
    };

    // Optimized panel navigation with event delegation
    const handlePanelNavigation = (event) => {
        const target = event.target;
        const openLink = target.closest('[data-menu="open-sub"]');
        const backButton = target.closest('[data-menu="back"]');

        if (openLink) {
            event.preventDefault();
            
            const parentItem = openLink.closest('.w-dyn-item');
            if (!parentItem) return;
            
            const nextPanel = parentItem.querySelector('[data-menu="sub-panel"]');
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
                .to(currentPanel, { x: '-100%', duration: 0.4, ease: 'power2.inOut' })
                .to(nextPanel, { x: '0%', visibility: 'visible', pointerEvents: 'auto', duration: 0.4, ease: 'power2.inOut' }, "<");
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
                .to(panelToReveal, { x: '0%', duration: 0.4, ease: 'power2.inOut' })
                .to(panelToClose, { x: '100%', pointerEvents: 'none', duration: 0.4, ease: 'power2.inOut' }, "<");
        }
    };

    // Attach event listeners
    document.addEventListener('click', handleGlobalClick, { passive: false });
    mainSidebar.addEventListener('click', handlePanelNavigation, { passive: false });
    backdrop.addEventListener('click', closeMenu, { passive: true });

    // --- 6. CLEANUP ON PAGE UNLOAD ---
    window.addEventListener('beforeunload', () => {
        clearTimeout(resizeTimeout);
        killCurrentTimeline();
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('click', handleGlobalClick);
        mainSidebar.removeEventListener('click', handlePanelNavigation);
        backdrop.removeEventListener('click', closeMenu);
    });
});
