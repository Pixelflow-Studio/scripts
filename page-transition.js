// Page Transition with GSAP and Smootify Integration
// Make sure to include GSAP in your Webflow project

// Create progress bar element
function createProgressBar() {
    const progressBar = document.createElement('div');
    progressBar.className = 'page-transition-progress';
    progressBar.innerHTML = `
        <div class="progress-container">
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <div class="progress-text">Loading...</div>
        </div>
    `;
    return progressBar;
}

// Initialize page transition when both DOM and Smootify are ready
function initializePageTransition() {
    
    // Get the overlay element
    const overlay = document.querySelector('.page-transition-overlay');
    
    // If overlay doesn't exist, exit
    if (!overlay) {
        console.warn('Page transition overlay not found. Make sure you have an element with class "page-transition-overlay"');
        return;
    }
    
    // Set initial state - overlay should be visible on page load
    gsap.set(overlay, {
        opacity: 1,
        visibility: 'visible',
        display: 'block'
    });
    
    // Force a reflow to ensure the overlay is properly rendered
    overlay.offsetHeight;
    
    // Progress bar is already added and animating from the immediate initialization above
    // We just need to trigger the fade-in when everything is ready
    
    // Remove overlay when page loads (no fade-in animation)
    function fadeInOnLoad() {
        // Get the progress bar
        const progressBar = overlay.querySelector('.page-transition-progress');
        const progressFill = progressBar ? progressBar.querySelector('.progress-fill') : null;
        
        // If progress bar exists and hasn't finished, complete it first
        if (progressBar && progressFill) {
            // Complete the progress bar animation
            gsap.to(progressFill, {
                width: '100%',
                duration: 0.3,
                ease: 'power2.out',
                onComplete: () => {
                    // Remove progress bar and hide overlay immediately
                    progressBar.remove();
                    gsap.set(overlay, {
                        opacity: 0,
                        visibility: 'hidden'
                    });
                }
            });
        } else {
            // No progress bar, just hide overlay immediately
            gsap.set(overlay, {
                opacity: 0,
                visibility: 'hidden'
            });
        }
    }
    
    // Fade out animation when navigating away
    function fadeOutOnNavigate() {
        // Show the overlay
        gsap.set(overlay, {
            visibility: 'visible'
        });
        
        gsap.to(overlay, {
            opacity: 1,
            duration: 1,
            ease: 'power3.in'
        });
    }
    
    // Handle page visibility changes (for mobile browsers)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Don't trigger fade out on tab change - just let the page handle it naturally
            // fadeOutOnNavigate();
        } else {
            // When returning to the tab, ensure overlay is hidden
            gsap.set(overlay, {
                opacity: 0,
                visibility: 'hidden'
            });
        }
    });
    
    // Handle beforeunload event
    window.addEventListener('beforeunload', function() {
        fadeOutOnNavigate();
    });
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', function() {
        // For Chrome, we need to handle this differently
        // The navigation happens immediately, so we can't delay it
        // Instead, we'll just trigger the fade out and let it happen
        fadeOutOnNavigate();
    });
    
    // Handle clicks on links that navigate away
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href && !link.href.includes('#') && !link.href.includes('javascript:') && link.target !== '_blank') {
            // Check if it's an external link or different page
            const currentDomain = window.location.origin;
            const linkDomain = new URL(link.href, window.location.href).origin;
            const currentUrl = window.location.href.split('?')[0]; // Remove query parameters
            const linkUrl = link.href.split('?')[0]; // Remove query parameters
            
            // Trigger transition for any navigation (including same page if it's a full page reload)
            if (linkDomain !== currentDomain || linkUrl !== currentUrl) {
                e.preventDefault();
                fadeOutOnNavigate();
                
                // Navigate after animation with consistent timing
                setTimeout(() => {
                    window.location.href = link.href;
                }, 1000);
            }
        }
    });
    
    // Handle browser back/forward buttons with proper history management
    let isNavigating = false;
    
    // Override pushState to track programmatic navigation
    const originalPushState = history.pushState;
    history.pushState = function() {
        originalPushState.apply(history, arguments);
        isNavigating = true;
    };
    
    // Override replaceState to track programmatic navigation
    const originalReplaceState = history.replaceState;
    history.replaceState = function() {
        originalReplaceState.apply(history, arguments);
        isNavigating = true;
    };
    
    // Simplified browser navigation handling
    // For Chrome, we'll focus on making the fade-in work properly
    // and let the browser handle navigation naturally
    
    // Handle beforeunload - this is the most reliable event
    window.addEventListener('beforeunload', function() {
        // Just trigger the fade out - don't try to delay navigation
        fadeOutOnNavigate();
    });
    
    // For back/forward buttons, we'll rely on the fade-in animation
    // when the new page loads, rather than trying to control the fade-out
    
    // Start the fade in animation after a small delay
    setTimeout(fadeInOnLoad, 100);
    
    // Optional: Add a class to body when transition is active
    function addTransitionClass() {
        document.body.classList.add('page-transitioning');
    }
    
    function removeTransitionClass() {
        document.body.classList.remove('page-transitioning');
    }
    
    // Enhanced fade out with body class
    function enhancedFadeOut() {
        addTransitionClass();
        fadeOutOnNavigate();
    }
    
    // Enhanced fade in with body class
    function enhancedFadeIn() {
        removeTransitionClass();
        fadeInOnLoad();
    }
    
    // Replace the original functions with enhanced versions
    window.pageTransitionFadeOut = enhancedFadeOut;
    window.pageTransitionFadeIn = enhancedFadeIn;
    
    // Initialize fade in with a small delay to ensure everything is ready
    setTimeout(() => {
        enhancedFadeIn();
    }, 50);
}

// Show loading state immediately when script loads
(function() {
    function initializeProgressBar() {
        const overlay = document.querySelector('.page-transition-overlay');
        if (overlay && typeof gsap !== 'undefined') {
            // Set overlay to visible immediately
            gsap.set(overlay, {
                opacity: 1,
                visibility: 'visible',
                display: 'block'
            });
            
            // Add progress bar immediately
            const progressBar = createProgressBar();
            overlay.appendChild(progressBar);
            
            // Start progress animation immediately
            const progressFill = progressBar.querySelector('.progress-fill');
            
            // Store progress bar reference globally so we can update it
            window.pageTransitionProgress = {
                element: progressFill,
                bar: progressBar,
                overlay: overlay
            };
            
            // Start with 0% progress
            gsap.set(progressFill, { width: '0%' });
        }
    }
    
    // Try to initialize immediately
    initializeProgressBar();
    
    // If GSAP isn't ready, wait for it
    if (typeof gsap === 'undefined') {
        // Check for GSAP every 100ms
        const gsapCheck = setInterval(function() {
            if (typeof gsap !== 'undefined') {
                clearInterval(gsapCheck);
                initializeProgressBar();
            }
        }, 100);
        
        // Fallback: if GSAP doesn't load within 2 seconds, just show the overlay
        setTimeout(function() {
            if (typeof gsap === 'undefined') {
                clearInterval(gsapCheck);
                const overlay = document.querySelector('.page-transition-overlay');
                if (overlay) {
                    overlay.style.opacity = '1';
                    overlay.style.visibility = 'visible';
                    overlay.style.display = 'block';
                }
            }
        }, 2000);
    }
})();

    // Wait for DOM, Smootify, and Swiper to be ready
    document.addEventListener('DOMContentLoaded', function() {
        let smootifyReady = false;
        let swiperReady = false;
        let progressStep = 0;
        
        function updateProgress(step) {
            if (window.pageTransitionProgress && window.pageTransitionProgress.element) {
                const progress = (step / 3) * 100; // 3 total steps
                gsap.to(window.pageTransitionProgress.element, {
                    width: progress + '%',
                    duration: 0.5,
                    ease: 'power2.out'
                });
            }
        }
        
        function checkAllReady() {
            if (smootifyReady && swiperReady) {
                console.log('Both Smootify and Swiper ready - initializing page transition');
                // Complete progress to 100%
                updateProgress(3);
                // Small delay to show completion, then initialize
                setTimeout(() => {
                    initializePageTransition();
                }, 300);
            }
        }
    
    // Check if Smootify is already loaded
    if (typeof Smootify !== 'undefined') {
        console.log('Smootify already loaded');
        updateProgress(1);
        smootifyReady = true;
        checkAllReady();
    } else {
        // Wait for Smootify to load
        document.addEventListener('smootify:loaded', function() {
            console.log('Smootify loaded');
            updateProgress(1);
            smootifyReady = true;
            checkAllReady();
        });
    }
    
    // Check if Swiper is already loaded
    if (typeof Swiper !== 'undefined') {
        console.log('Swiper already loaded');
        updateProgress(2);
        swiperReady = true;
        checkAllReady();
    } else {
        // Wait for Swiper to initialize (common event names)
        const swiperEvents = ['swiper:init', 'swiper:ready', 'swiper:loaded'];
        swiperEvents.forEach(eventName => {
            document.addEventListener(eventName, function() {
                console.log('Swiper initialized');
                updateProgress(2);
                swiperReady = true;
                checkAllReady();
            });
        });
        
        // Alternative: Check for Swiper elements periodically
        const swiperCheck = setInterval(function() {
            const swiperElements = document.querySelectorAll('.swiper, [data-swiper], .swiper-container');
            if (swiperElements.length > 0 && typeof Swiper !== 'undefined') {
                console.log('Swiper detected - initializing page transition');
                clearInterval(swiperCheck);
                updateProgress(2);
                swiperReady = true;
                checkAllReady();
            }
        }, 100);
    }
    
    // Fallback: If neither loads within 5 seconds, initialize anyway
    setTimeout(function() {
        if (!smootifyReady || !swiperReady) {
            console.log('Timeout reached - initializing page transition');
            updateProgress(3);
            setTimeout(() => {
                initializePageTransition();
            }, 300);
        }
    }, 5000);
});

// Optional: Add CSS for the overlay and progress bar (you can also add this in Webflow's custom CSS)
const style = document.createElement('style');
style.textContent = `
    .page-transition-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #000000;
        z-index: 9999;
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
    }
    
    .page-transitioning {
        overflow: hidden;
    }
    
    .page-transitioning .page-transition-overlay {
        pointer-events: auto;
    }
    
    .page-transition-progress {
        text-align: center;
        color: white;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10000;
    }
    
    .progress-container {
        max-width: 300px;
        width: 100%;
    }
    
    .progress-bar {
        width: 100%;
        height: 6px;
        background-color: rgba(255, 255, 255, 0.15);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 15px;
        border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .progress-fill {
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg, #e6007e 0%, #ff1493 100%);
        border-radius: 3px;
        transition: width 0.3s ease;
        box-shadow: 0 0 10px rgba(230, 0, 126, 0.5);
    }
    
    .progress-text {
        font-size: 16px;
        font-weight: 600;
        letter-spacing: 1px;
        color: white;
        text-transform: uppercase;
        opacity: 0.9;
    }
`;
document.head.appendChild(style);
