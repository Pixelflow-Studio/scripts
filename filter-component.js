// ========================================================================
// FILTER COMPONENT STYLES
// ------------------------------------------------------------------------
// These styles control the appearance and behavior of the filter UI.
// They include states for checkboxes, layout adjustments, and a CSS-only
// technique to hide empty filter groups.
// ========================================================================

const filterStyles = `
[filter=active].preselected-filter {
  display: none;
}

.filter_checkbox:nth-of-type(1) {
  margin-top: 0.5rem !important;
}

.filter_item:nth-of-type(1) {
  margin-top: 0.5rem;
}

.filter_checkbox:has(input[type="checkbox"]:not(:checked)):hover .filter_checkbox-icon {
  background-color: var(--base-color-brand--pink-light);
  border-color: var(--base-color-brand--pink-light);
}

input[type="checkbox"]:checked + .filter_checkbox-label {
  font-weight: 500;
}

.filter-count-label {
  opacity: 0.7;
  font-weight: 400;
}

.filter_item:has(.active-filters-wrapper:empty),
.filter_item:has(.active-filters-wrapper > :only-child) {
  display: none;
}
`;

// ========================================================================
// PERFORMANCE OPTIMIZED FILTER COMPONENT
// ------------------------------------------------------------------------
// This optimized version includes:
// - Separated CSS and JS concerns
// - Cached DOM queries
// - Debounced resize handlers
// - Efficient event delegation
// - Reduced reflows and repaints
// - Memory leak prevention
// ========================================================================

class FilterComponent {
  constructor() {
    this.cache = new Map();
    this.observers = new Set();
    this.resizeTimer = null;
    this.isInitialized = false;
    
    // Bind methods to preserve context
    this.handleResize = this.debounce(this.handleResize.bind(this), 250);
    this.setupStyles = this.setupStyles.bind(this);
    this.init = this.init.bind(this);
  }

  /**
   * Debounce utility for performance optimization
   */
  debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Throttle utility for scroll/resize events
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Cache DOM elements for better performance
   */
  getCachedElement(selector, context = document) {
    if (!this.cache.has(selector)) {
      this.cache.set(selector, context.querySelector(selector));
    }
    return this.cache.get(selector);
  }

  /**
   * Cache multiple DOM elements
   */
  getCachedElements(selector, context = document) {
    const cacheKey = `${selector}_all`;
    if (!this.cache.has(cacheKey)) {
      this.cache.set(cacheKey, Array.from(context.querySelectorAll(selector)));
    }
    return this.cache.get(cacheKey);
  }

  /**
   * Inject styles efficiently
   */
  setupStyles() {
    if (document.getElementById('filter-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'filter-styles';
    style.textContent = filterStyles;
    document.head.appendChild(style);
  }

  /**
   * Optimized accordion functionality
   */
  setupAccordions() {
    const accordionItems = this.getCachedElements('.filter_item:has([filter-element="accordion-trigger"])');
    
    if (accordionItems.length === 0) return;

    // Use event delegation for better performance
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[filter-element="accordion-trigger"]');
      if (!trigger) return;

      const item = trigger.closest('.filter_item');
      if (!item) return;

      this.toggleAccordion(item);
    });

    // Set initial states efficiently
    accordionItems.forEach(item => this.setInitialAccordionState(item));
    
    // Watch for filter changes to update accordion state
    this.setupFilterChangeObserver();
  }

  /**
   * Watch for filter changes and update accordion state accordingly
   */
  setupFilterChangeObserver() {
    // Watch for checkbox changes
    document.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        this.updateAccordionStateAfterFilterChange(e.target);
      }
    });

    // Watch for filter clearing actions
    document.addEventListener('click', (e) => {
      const target = e.target;
      const isClearAction = target.closest('[data-clear-filters]') || 
                           target.closest('.clear-filters') ||
                           target.closest('.filter-clear') ||
                           target.textContent?.toLowerCase().includes('clear all') ||
                           target.textContent?.toLowerCase().includes('reset filters');
      
      if (isClearAction) {
        // Use setTimeout to ensure the clear action completes first
        setTimeout(() => this.updateAllAccordionStates(), 100);
      }
    });

    // Watch for programmatic filter clearing via attribute changes
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          // Check for common filter reset attributes
          const target = mutation.target;
          if (target.hasAttribute('data-filters-cleared') || 
              target.hasAttribute('data-reset-filters') ||
              target.classList.contains('filters-reset')) {
            shouldUpdate = true;
          }
        } else if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if this looks like a filter clear action
              if (node.classList && (
                node.classList.contains('filter-clear') ||
                node.classList.contains('clear-filters') ||
                node.textContent?.toLowerCase().includes('clear')
              )) {
                shouldUpdate = true;
              }
            }
          });
        }
      });
      
      if (shouldUpdate) {
        setTimeout(() => this.updateAllAccordionStates(), 100);
      }
    });

    // Observe the document body for filter-related changes
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['data-filters-cleared', 'data-reset-filters']
    });

    this.observers.add(observer);
  }

  /**
   * Update accordion state when a filter checkbox changes
   */
  updateAccordionStateAfterFilterChange(checkbox) {
    const accordionItem = checkbox.closest('.filter_item');
    if (!accordionItem) return;

    const pane = accordionItem.querySelector('[filter-element="accordion-pane"]');
    const unselectedFilters = pane?.querySelectorAll('.filter_checkbox:not(:has(.w--redirected-checked))');
    
    if (!unselectedFilters || unselectedFilters.length === 0) return;

    // If accordion is closed but filters are now visible, update the state
    if (!accordionItem.classList.contains('is-open')) {
      const hasVisibleFilters = Array.from(unselectedFilters).some(filter => 
        filter.style.display !== 'none' && 
        filter.offsetHeight > 0
      );
      
      if (hasVisibleFilters) {
        // Update the visual state to match the actual state
        this.syncAccordionVisualState(accordionItem, true);
      }
    }
  }

  /**
   * Update all accordion states (used when filters are cleared)
   */
  updateAllAccordionStates() {
    const accordionItems = this.getCachedElements('.filter_item:has([filter-element="accordion-trigger"])');
    
    accordionItems.forEach(item => {
      const pane = item.querySelector('[filter-element="accordion-pane"]');
      const unselectedFilters = pane?.querySelectorAll('.filter_checkbox:not(:has(.w--redirected-checked))');
      
      if (unselectedFilters && unselectedFilters.length > 0) {
        const hasVisibleFilters = Array.from(unselectedFilters).some(filter => 
          filter.style.display !== 'none' && 
          filter.offsetHeight > 0
        );
        
        if (hasVisibleFilters && !item.classList.contains('is-open')) {
          this.syncAccordionVisualState(item, true);
        }
      }
    });
  }

  /**
   * Sync the visual state of accordion with its actual state
   */
  syncAccordionVisualState(item, shouldBeOpen) {
    const icon = item.querySelector('[filter-element="accordion-chevron"]');
    const pane = item.querySelector('[filter-element="accordion-pane"]');
    const unselectedFilters = pane?.querySelectorAll('.filter_checkbox:not(:has(.w--redirected-checked))');
    
    if (!icon || !pane || !unselectedFilters) return;

    if (shouldBeOpen) {
      // Show filters and update icon
      gsap.set(unselectedFilters, { 
        height: 38, 
        autoAlpha: 1, 
        marginTop: "auto", 
        marginBottom: "auto", 
        paddingTop: "auto", 
        paddingBottom: "auto",
        y: 0 
      });
      gsap.set(icon, { rotation: -180 });
      item.classList.add('is-open');
    } else {
      // Hide filters and update icon
      gsap.set(unselectedFilters, { 
        height: 0, 
        autoAlpha: 0, 
        marginTop: 0, 
        marginBottom: 0, 
        paddingTop: 0, 
        paddingBottom: 0, 
        y: 10 
      });
      gsap.set(icon, { rotation: 0 });
      item.classList.remove('is-open');
    }
  }

  /**
   * Set initial accordion state without animations
   */
  setInitialAccordionState(item) {
    const pane = item.querySelector('[filter-element="accordion-pane"]');
    const icon = item.querySelector('[filter-element="accordion-chevron"]');
    
    if (!pane || !icon) return;

    if (item.classList.contains('is-open')) {
      gsap.set(icon, { rotation: -180 });
    } else {
      const unselectedFilters = pane.querySelectorAll('.filter_checkbox:not(:has(.w--redirected-checked))');
      gsap.set(unselectedFilters, { 
        height: 0, 
        autoAlpha: 0, 
        marginTop: 0, 
        marginBottom: 0, 
        paddingTop: 0, 
        paddingBottom: 0, 
        y: 10 
      });
      gsap.set(icon, { rotation: 0 });
    }
  }

  /**
   * Optimized accordion toggle with reduced reflows
   */
  toggleAccordion(item) {
    const pane = item.querySelector('[filter-element="accordion-pane"]');
    const icon = item.querySelector('[filter-element="accordion-chevron"]');
    
    if (!pane || !icon) return;

    const isOpen = item.classList.contains('is-open');
    const unselectedFilters = pane.querySelectorAll('.filter_checkbox:not(:has(.w--redirected-checked))');
    
    // Use requestAnimationFrame for smooth animations
    requestAnimationFrame(() => {
      gsap.to(icon, { 
        rotation: isOpen ? 0 : -180, 
        duration: 0.5, 
        ease: 'power3.inOut' 
      });

      if (isOpen) {
        this.closeAccordion(unselectedFilters, item);
      } else {
        this.openAccordion(unselectedFilters, item);
      }
    });
  }

  /**
   * Optimized accordion close
   */
  closeAccordion(unselectedFilters, item) {
    gsap.to(unselectedFilters, {
      duration: 0.4,
      height: 0,
      autoAlpha: 0,
      marginTop: 0, 
      marginBottom: 0, 
      paddingTop: 0, 
      paddingBottom: 0,
      y: 10,
      ease: 'power2.in',
      stagger: 0.04
    });
    item.classList.remove('is-open');
  }

  /**
   * Optimized accordion open
   */
  openAccordion(unselectedFilters, item) {
    gsap.to(unselectedFilters, {
      duration: 0.6,
      height: 38,
      y: 0,
      autoAlpha: 1,
      marginTop: "auto", 
      marginBottom: "auto", 
      paddingTop: "auto", 
      paddingBottom: "auto",
      ease: 'power2.out',
      stagger: { each: 0.07, from: "start" }
    });
    item.classList.add('is-open');
  }

  /**
   * Optimized mobile filter panel
   */
  setupMobilePanel() {
    const elements = {
      openTrigger: this.getCachedElement('.is-filter-trigger'),
      closeTriggers: this.getCachedElements('[filter-element="close"]'),
      backdrop: this.getCachedElement('.modal-backdrop'),
      wrapper: this.getCachedElement('.filter-wrapper'),
      container: this.getCachedElement('.filters-container')
    };

    if (!this.validateElements(elements)) return;

    this.mobileElements = elements;
    this.isMobileSetup = false;
    this.timeline = null;

    this.setupMobileAnimations();
  }

  /**
   * Validate required elements exist
   */
  validateElements(elements) {
    const required = ['openTrigger', 'backdrop', 'wrapper', 'container'];
    return required.every(key => elements[key]) && elements.closeTriggers.length > 0;
  }

  /**
   * Get scrollbar width efficiently
   */
  getScrollbarWidth() {
    if (document.body.scrollHeight <= window.innerHeight) return 0;
    return window.innerWidth - document.documentElement.clientWidth;
  }

  /**
   * Optimized mobile animations setup
   */
  setupMobileAnimations() {
    const isMobile = window.innerWidth <= 991;

    if (isMobile && !this.isMobileSetup) {
      this.setupMobileMode();
    } else if (!isMobile && this.isMobileSetup) {
      this.teardownMobileMode();
    }
  }

  /**
   * Setup mobile mode with optimized event handling
   */
  setupMobileMode() {
    this.isMobileSetup = true;
    
    gsap.set(this.mobileElements.backdrop, { opacity: 0 });
    gsap.set(this.mobileElements.wrapper, { pointerEvents: 'none' });

    this.timeline = gsap.timeline({ paused: true })
      .to(this.mobileElements.backdrop, { 
        opacity: 1, 
        duration: 0.5, 
        ease: 'power2.inOut' 
      })
      .set(this.mobileElements.wrapper, { pointerEvents: 'auto' }, "<")
      .to(this.mobileElements.container, { 
        x: 0, 
        duration: 0.5, 
        ease: 'power3.out' 
      }, "<");

    // Use event delegation for better performance
    this.mobileElements.openTrigger.addEventListener('click', this.openPanel.bind(this));
    this.mobileElements.closeTriggers.forEach(trigger => 
      trigger.addEventListener('click', this.closePanel.bind(this))
    );
    this.mobileElements.backdrop.addEventListener('click', this.closePanel.bind(this));
  }

  /**
   * Teardown mobile mode and cleanup
   */
  teardownMobileMode() {
    this.isMobileSetup = false;
    
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
    
    // Reset body styles
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    // Remove event listeners
    this.mobileElements.openTrigger.removeEventListener('click', this.openPanel.bind(this));
    this.mobileElements.closeTriggers.forEach(trigger => 
      trigger.removeEventListener('click', this.closePanel.bind(this))
    );
    this.mobileElements.backdrop.removeEventListener('click', this.closePanel.bind(this));
    
    // Clear GSAP properties
    gsap.set([this.mobileElements.backdrop, this.mobileElements.wrapper, this.mobileElements.container], { 
      clearProps: "all" 
    });
  }

  /**
   * Optimized panel open with layout shift prevention
   */
  openPanel() {
    const scrollbarWidth = this.getScrollbarWidth();
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = 'hidden';
    
    if (this.timeline) {
      this.timeline.play();
    }
  }

  /**
   * Optimized panel close with proper cleanup
   */
  closePanel() {
    if (this.timeline) {
      this.timeline.reverse();
      this.timeline.eventCallback('onReverseComplete', () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      });
    }
  }

  /**
   * Handle resize events efficiently
   */
  handleResize() {
    this.setupMobileAnimations();
  }

  /**
   * Initialize the filter component
   */
  init() {
    if (this.isInitialized) return;
    
    this.setupStyles();
    this.setupAccordions();
    this.setupMobilePanel();
    
    // Use passive event listeners for better performance
    window.addEventListener('resize', this.handleResize, { passive: true });
    
    this.isInitialized = true;
  }

  /**
   * Public method to manually update accordion states
   * Call this after programmatically clearing filters
   */
  updateAccordionStates() {
    this.updateAllAccordionStates();
  }

  /**
   * Cleanup method to prevent memory leaks
   */
  destroy() {
    // Clear cache
    this.cache.clear();
    
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Clear timers
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    
    // Kill GSAP timelines
    if (this.timeline) {
      this.timeline.kill();
    }
    
    this.isInitialized = false;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const filterComponent = new FilterComponent();
  filterComponent.init();
  
  // Expose for potential external access
  window.filterComponent = filterComponent;
});
