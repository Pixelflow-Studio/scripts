/**
 * ==================================================================================
 * UNIVERSAL PAGE TRANSITION SYSTEM
 * ==================================================================================
 * Version: 1.0.0
 * Purpose: Smooth page transitions to cover initial white gaps
 * Browser Support: Modern browsers (ES6+)
 * ==================================================================================
 */

// --- CONFIGURATION ---
const PAGE_TRANSITION_CONFIG = {
  enabled: true,
  backgroundColor: '#000000',
  fadeOutDuration: 800,
  easing: 'ease-out',
  
  // Auto-hide settings
  autoHide: true,
  autoHideDelay: 1000, // Hide after 1 second
  minDisplayTime: 300 // Minimum time to show transition
};

// --- STYLES ---
const pageTransitionStyles = `
  .page-transition-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: ${PAGE_TRANSITION_CONFIG.backgroundColor};
    z-index: 999999;
    opacity: 1;
    visibility: visible;
    transition: opacity ${PAGE_TRANSITION_CONFIG.fadeOutDuration}ms ${PAGE_TRANSITION_CONFIG.easing}, 
                visibility ${PAGE_TRANSITION_CONFIG.fadeOutDuration}ms ${PAGE_TRANSITION_CONFIG.easing};
  }
  
  .page-transition-overlay.hidden {
    opacity: 0;
    visibility: hidden;
  }
  
  /* Prevent flash of unstyled content */
  .page-transition-preload {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: ${PAGE_TRANSITION_CONFIG.backgroundColor};
    z-index: 999998;
  }
`;

// --- UTILITY FUNCTIONS ---
const Utils = {
  // Inject styles safely
  injectStyles() {
    try {
      const styleSheet = document.createElement('style');
      styleSheet.textContent = pageTransitionStyles;
      styleSheet.setAttribute('data-page-transition', 'true');
      document.head.appendChild(styleSheet);
      return true;
    } catch (error) {
      console.error('[Page Transition] Failed to inject styles:', error);
      return false;
    }
  },
  

  
  // Get page load time
  getPageLoadTime() {
    return performance.now();
  },
  
  // Debounce function
  debounce(func, wait) {
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
};

// --- PAGE TRANSITION CLASS ---
class PageTransition {
  constructor() {
    this.overlay = null;
    this.isTransitioning = false;
    this.startTime = 0;
    this.autoHideTimer = null;
    this.isInitialized = false;
  }
  
  // Initialize the page transition system
  init() {
    if (this.isInitialized || !PAGE_TRANSITION_CONFIG.enabled) return;
    
    // Inject styles
    if (!Utils.injectStyles()) {
      console.error('[Page Transition] Failed to initialize - styles injection failed');
      return;
    }
    
    // Create preload overlay to prevent flash
    this.createPreloadOverlay();
    
    // Create main overlay
    this.createOverlay();
    
    // Set up event listeners
    this.setupEventListeners();
    
    this.isInitialized = true;
    console.log('[Page Transition] Initialized successfully');
  }
  
  // Create preload overlay to prevent initial flash
  createPreloadOverlay() {
    const preload = document.createElement('div');
    preload.className = 'page-transition-preload';
    document.body.appendChild(preload);
    
    // Remove preload after a short delay
    setTimeout(() => {
      if (preload.parentNode) {
        preload.parentNode.removeChild(preload);
      }
    }, 100);
  }
  
  // Create the main overlay
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'page-transition-overlay';
    document.body.appendChild(this.overlay);
  }
  
  // Set up event listeners
  setupEventListeners() {
    // Hide transition when page is fully loaded
    if (PAGE_TRANSITION_CONFIG.autoHide) {
      this.setupAutoHide();
    }
  }
  
  // Set up auto-hide functionality
  setupAutoHide() {
    const hideTransition = () => {
      // Wait for minimum display time
      const elapsed = performance.now() - this.startTime;
      const remainingTime = Math.max(0, PAGE_TRANSITION_CONFIG.minDisplayTime - elapsed);
      
      setTimeout(() => {
        this.hide();
      }, remainingTime);
    };
    
    // Try multiple triggers for auto-hide
    if (document.readyState === 'complete') {
      hideTransition();
    } else {
      window.addEventListener('load', hideTransition);
    }
    
    // Fallback timer
    this.autoHideTimer = setTimeout(() => {
      if (this.overlay && !this.overlay.classList.contains('hidden')) {
        console.warn('[Page Transition] Auto-hiding after timeout');
        this.hide();
      }
    }, PAGE_TRANSITION_CONFIG.autoHideDelay);
  }
  
  // Show the transition
  show() {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    this.startTime = performance.now();
    
    // Recreate overlay if needed
    if (!this.overlay) {
      this.createOverlay();
    }
    
    if (this.overlay) {
      this.overlay.classList.remove('hidden');
    }
    
    this.isTransitioning = false;
  }
  
  // Hide the transition
  hide() {
    if (!this.overlay || this.isTransitioning) return;
    
    this.isTransitioning = true;
    
    // Clear auto-hide timer
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
    
    // Hide the overlay
    this.overlay.classList.add('hidden');
    
    // Remove overlay after animation
    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
        this.overlay = null;
      }
      this.isTransitioning = false;
    }, PAGE_TRANSITION_CONFIG.fadeOutDuration);
  }
  
  // Force hide (immediate)
  forceHide() {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
    
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
      this.overlay = null;
    }
    
    this.isTransitioning = false;
  }
  
  // Update configuration
  updateConfig(newConfig) {
    Object.assign(PAGE_TRANSITION_CONFIG, newConfig);
    console.log('[Page Transition] Configuration updated:', newConfig);
  }
  
  // Get current status
  getStatus() {
    return {
      isTransitioning: this.isTransitioning,
      isInitialized: this.isInitialized,
      hasOverlay: !!this.overlay,
      config: { ...PAGE_TRANSITION_CONFIG }
    };
  }
}

// --- GLOBAL INSTANCE ---
const globalPageTransition = new PageTransition();

// --- INITIALIZATION ---

// Initialize immediately if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    globalPageTransition.init();
  });
} else {
  globalPageTransition.init();
}

// Also initialize on window load as backup
window.addEventListener('load', () => {
  if (!globalPageTransition.isInitialized) {
    globalPageTransition.init();
  }
});

// --- PUBLIC API ---
window.PageTransition = {
  // Instance methods
  show: () => globalPageTransition.show(),
  hide: () => globalPageTransition.hide(),
  forceHide: () => globalPageTransition.forceHide(),
  
  // Configuration
  updateConfig: (config) => globalPageTransition.updateConfig(config),
  getConfig: () => ({ ...PAGE_TRANSITION_CONFIG }),
  
  // Status
  getStatus: () => globalPageTransition.getStatus(),
  isTransitioning: () => globalPageTransition.isTransitioning,
  
  // Reinitialize
  reinit: () => {
    globalPageTransition.forceHide();
    globalPageTransition.isInitialized = false;
    globalPageTransition.init();
  }
};

// --- CONSOLE LOGGING ---
console.log('[Page Transition] Script loaded successfully');
console.log('[Page Transition] Use window.PageTransition to control the transition');

// --- EXPORT FOR MODULE SYSTEMS ---
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PageTransition, PAGE_TRANSITION_CONFIG };
}
