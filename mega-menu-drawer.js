document.addEventListener("DOMContentLoaded", () => {
    // --- 1. ELEMENT SELECTION ---
    const sidebarComponent = document.querySelector('[data-menu="component"]');
    const backdrop = document.querySelector('[data-menu="backdrop"]');
    const mainSidebar = document.querySelector('[data-menu="main-panel"]');
    const contentToSlide = document.querySelector('[data-menu="content-to-slide"]');
    
    // --- THIS IS THE CRITICAL FIX ---
    // First, find all nav links within the main content area.
    const allNavLinks = contentToSlide.querySelectorAll('.mega-menu-nav-link');
    // Then, filter this list to include only the links that are NOT inside a sub-panel.
    const primaryNavLinks = Array.from(allNavLinks).filter(link => !link.closest('[data-menu="sub-panel"]'));

    if (!sidebarComponent || !mainSidebar || !contentToSlide || primaryNavLinks.length === 0) {
        console.error("Mega Menu Error: A critical data-attribute target is missing or no primary links were found.");
        return;
    }

    // --- 2. STATE MANAGEMENT ---
    const panelStack = [];
    const originalParents = new Map();

    // --- 3. ANIMATION AND CONTROL FUNCTIONS ---
    let isAnimating = false;

    const resetSubNavs = () => {
        originalParents.forEach((parent, child) => {
            parent.appendChild(child);
            gsap.set(child, { x: '100%', visibility: 'hidden', pointerEvents: 'none' });
        });
        originalParents.clear();
        gsap.set(contentToSlide, { x: '0%' });
        panelStack.length = 0;
    };
      
    const openMenu = () => {
        if (isAnimating) return;
        isAnimating = true;

        panelStack.push(contentToSlide);
        const scrollbarWidth = getBodyScrollbarWidth();
        document.body.style.paddingRight = `${scrollbarWidth}px`;
        document.body.style.overflow = 'hidden';

        const tl = gsap.timeline({ onComplete: () => { isAnimating = false; } });
        tl.set(sidebarComponent, { pointerEvents: 'auto' })
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
        if (isAnimating) return;
        isAnimating = true;

        const tl = gsap.timeline({
            onComplete: () => {
                resetSubNavs();
                gsap.set(sidebarComponent, { pointerEvents: 'none' });
                gsap.set(primaryNavLinks, { opacity: 0, y: 0 }); 
                document.body.style.paddingRight = '';
                document.body.style.overflow = '';
                isAnimating = false;
            }
        });
        
        tl.to(backdrop, { opacity: 0, duration: 0.4, ease: 'power2.in' })
          .to(mainSidebar, { x: '-100%', duration: 0.4, ease: 'power2.in' }, "<");
    };

    // --- 4. GLOBAL EVENT LISTENERS ---
    document.addEventListener('click', (event) => {
        if (event.target.closest('[data-menu="open"]')) { openMenu(); }
        if (event.target.closest('[data-menu="close"]')) { closeMenu(); }
    });
    backdrop.addEventListener('click', closeMenu);

    // --- 5. PANEL NAVIGATION LISTENER ---
    mainSidebar.addEventListener('click', (event) => {
        const openLink = event.target.closest('[data-menu="open-sub"]');
        const backButton = event.target.closest('[data-menu="back"]');

        if (openLink) {
            const parentItem = openLink.closest('.w-dyn-item');
            if (!parentItem) return;
            const nextPanel = parentItem.querySelector('[data-menu="sub-panel"]');
            if (!nextPanel) return;
            
            event.preventDefault();
            const currentPanel = panelStack[panelStack.length - 1];
            originalParents.set(nextPanel, nextPanel.parentElement);
            mainSidebar.appendChild(nextPanel);
            panelStack.push(nextPanel);

            const tl = gsap.timeline();
            tl.to(currentPanel, { x: '-100%', duration: 0.4, ease: 'power2.inOut' })
              .to(nextPanel, { x: '0%', visibility: 'visible', pointerEvents: 'auto', duration: 0.4, ease: 'power2.inOut' }, "<");
        }
        
        if (backButton) {
            if (panelStack.length <= 1) return;
            const panelToClose = panelStack.pop();
            const panelToReveal = panelStack[panelStack.length - 1];
            const originalParent = originalParents.get(panelToClose);

            const tl = gsap.timeline({
                onComplete: () => {
                    if (originalParent) {
                        originalParent.appendChild(panelToClose);
                        originalParents.delete(panelToClose);
                    }
                }
            });
            
            tl.to(panelToReveal, { x: '0%', duration: 0.4, ease: 'power2.inOut' })
              .to(panelToClose, { x: '100%', pointerEvents: 'none', duration: 0.4, ease: 'power2.inOut' }, "<");
        }
    });

    // --- 6. HELPER FUNCTION ---
    function getBodyScrollbarWidth() {
        return window.innerWidth - document.documentElement.clientWidth;
    }
});
