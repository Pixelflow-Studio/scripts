

// =================================================================================
// Smootify Review System - Enhanced Star Rating
// =================================================================================
// 
// NEW FEATURE: Realistic Star Rating Display
// - Products with ratings like 2.67 now show 2 full stars + 67% of the 3rd star
// - Configurable thresholds for full/half star display
// - Smooth transitions and hover effects
// - Fallback option to use simple rounding if preferred
// 
// Configuration options in CONFIG.STYLING.STARS.PRECISE_RATING:
// - ENABLED: true/false - Enable precise decimal ratings
// - FULL_STAR_THRESHOLD: 0.9 - Show as full star if >= 90% filled
// - HALF_STAR_THRESHOLD: 0.1 - Show as half star if >= 10% filled  
// - HALF_STAR_LIGHTNESS: 0.6 - How much lighter to make half stars
// - USE_SIMPLE_ROUNDING: false - Set to true for old Math.round() behavior
// =================================================================================

// Wrap everything in an IIFE to avoid global scope pollution
(function() {
  'use strict';
  
  // Prevent multiple initializations
  if (window.smootifyReviewsInitialized) return;
  window.smootifyReviewsInitialized = true;
  
// Run on pages
const isProductPage = window.location.pathname.includes('/product/');
const isCollectionPage = window.location.pathname.includes('/collection/');
const isHomePage = window.location.pathname === '/';

if (!isProductPage && !isCollectionPage && !isHomePage) {
  return;
}

// =================================================================================
// Configuration & Type Definitions
// =================================================================================

/**
* @typedef {Object} Review
* @property {string} Shopify_ID - The Shopify product ID
* @property {number} Review_Rating - Rating from 1-5
* @property {string} Review_Name - Customer name
* @property {string} Review_Review - Review content
* @property {number} Review_DateTime - Timestamp in milliseconds
* @property {string} Product - Product name
*/

/**
* @typedef {Object} SortAndFilter
* @property {string} sort - Current sort method ('Newest', 'Oldest', 'Highest')
* @property {number|null} filterRating - Current rating filter (1-5 or null)
*/

const CONFIG = {
 API_URL: 'https://x8ki-letl-twmt.n7.xano.io/api:LDyz3cwj/ALL_product_reviews',
 DEBOUNCE_DELAY: 250,
 MAX_RETRIES: 3,
 RETRY_DELAY: 1000,
 TIME_CONSTANTS: {
   MINUTE: 60,
   HOUR: 3600,
   DAY: 86400,
   MONTH: 2592000,
   YEAR: 31536000
 },
 SELECTORS: {
   PRODUCT_CARDS: 'smootify-product[data-id], .sm-product[data-id]',
   RATING_COMPONENT: '[review="productCard_rating"]',
   STAR_RATING: '[review="productCard_starRating"]',
   REVIEW_TOTAL: '[review="productCard_reviewTotal"]',
   MAIN_PRODUCT: 'main smootify-product[data-id]:not([data-parent-id])',
   REVIEW_HEADER: '.review_ui-header',
   REVIEW_FILTER: '.review_ui-filter',
   EMPTY_STATE: '.review-empty',
   REVIEWS_CONTAINER: '#reviews-container',
   TEMPLATE: '#review-card-template'
 },
 STYLING: {
   STARS: {
     FILLED_COLOR: 'gold',           // Color for filled stars
     EMPTY_COLOR: '#f0f0f0',            // Color for empty stars (or 'transparent')
     STROKE_COLOR: '#666666',          // Border color for stars
     STROKE_WIDTH: '1px',            // Border width for stars
     SIZE: '16px',                   // Size of stars
     SPACING: '0px',                  // Space between stars
     PRECISE_RATING: {
       ENABLED: true,                // Enable precise decimal ratings
       FULL_STAR_THRESHOLD: 0.9,     // Show as full star if >= 90% filled
       HALF_STAR_THRESHOLD: 0.1,     // Show as half star if >= 10% filled
       HALF_STAR_LIGHTNESS: 0.6,     // How much lighter to make half stars
       USE_SIMPLE_ROUNDING: false    // Set to true to use old Math.round() behavior
     }
   },
   ANIMATIONS: {
     ENABLED: true,                  // Enable/disable animations
     DURATION: 0.6,                  // Animation duration in seconds
     STAGGER: 0.1,                   // Delay between each review card
     EASE: "power3.out"              // Animation easing
   },
       COLORS: {
      PRIMARY: '#080331',             // Primary color for UI elements and text
      HOVER: '#e6007e',              // Hover color for interactive elements
      WARNING: '#ffc107'              // Warning color
    }
 }
};

// =================================================================================
// Global State & Data Store
// =================================================================================

const reviewDataStore = {
 reviewsByProductId: new Map(),
 isDataFetched: false
};

// =================================================================================
// Caching System
// =================================================================================

const CACHE_CONFIG = {
  CACHE_KEY: 'smootify_reviews_cache',
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  VERSION: '1.0' // Increment this when you make breaking changes
};

/**
 * Cache management utilities
 */
const cacheManager = {
  /**
   * Save data to localStorage with timestamp
   */
  save: function(data) {
    try {
      const cacheData = {
        data: data,
        timestamp: Date.now(),
        version: CACHE_CONFIG.VERSION
      };
      localStorage.setItem(CACHE_CONFIG.CACHE_KEY, JSON.stringify(cacheData));
      console.log('Smootify reviews: Data cached successfully');
    } catch (error) {
      console.warn('Smootify reviews: Failed to save cache', error);
    }
  },

  /**
   * Load data from localStorage if valid
   */
  load: function() {
    try {
      const cached = localStorage.getItem(CACHE_CONFIG.CACHE_KEY);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      
      // Check if cache is expired
      const isExpired = Date.now() - cacheData.timestamp > CACHE_CONFIG.CACHE_DURATION;
      
      // Check if version is outdated
      const isOutdated = cacheData.version !== CACHE_CONFIG.VERSION;
      
      if (isExpired || isOutdated) {
        console.log('Smootify reviews: Cache expired or outdated, will fetch fresh data');
        this.clear();
        return null;
      }

      console.log('Smootify reviews: Loading from cache');
      return cacheData.data;
    } catch (error) {
      console.warn('Smootify reviews: Failed to load cache', error);
      this.clear();
      return null;
    }
  },

  /**
   * Clear the cache
   */
  clear: function() {
    try {
      localStorage.removeItem(CACHE_CONFIG.CACHE_KEY);
      console.log('Smootify reviews: Cache cleared');
    } catch (error) {
      console.warn('Smootify reviews: Failed to clear cache', error);
    }
  },

  /**
   * Check if cache exists and is valid
   */
  isValid: function() {
    return this.load() !== null;
  }
};

/** @type {SortAndFilter} */
let currentSortAndFilter = {
 sort: 'Newest',
 filterRating: null
};

// =================================================================================
// Helper Function - DEBOUNCE (Prevents crash)
// =================================================================================

/**
* Delays the execution of a function until after a certain amount of time has
* passed without that function being called. Prevents infinite loops and crashes.
* @param {Function} func The function to debounce.
* @param {number} delay The delay in milliseconds.
* @returns {Function} The new debounced function.
*/
function debounce(func, delay = CONFIG.DEBOUNCE_DELAY) {
 let timeoutId;
 return function(...args) {
     clearTimeout(timeoutId);
     timeoutId = setTimeout(() => {
         func.apply(this, args);
     }, delay);
 };
}

// =================================================================================
// Enhanced API Fetching with Retry Logic
// =================================================================================

/**
* Fetches data with automatic retry logic
* @param {string} url - The URL to fetch
* @param {number} maxRetries - Maximum number of retry attempts
* @returns {Promise<Response>}
*/
async function fetchWithRetry(url, maxRetries = CONFIG.MAX_RETRIES) {
 for (let i = 0; i < maxRetries; i++) {
   try {
     const response = await fetch(url);
     if (!response.ok) throw new Error(`API responded with status: ${response.status}`);
     return response;
   } catch (error) {
     if (i === maxRetries - 1) throw error;
     await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * (i + 1)));
   }
 }
}

// =================================================================================
// Main Execution Block
// =================================================================================

// Multiple initialization strategies
let isInitialized = false;

function initializeIfReady() {
    if (isInitialized) return;
    
    // Check if Smootify elements exist
    const smootifyElements = document.querySelectorAll('smootify-product, .sm-product');
    if (smootifyElements.length > 0) {
        console.log('Smootify review system: Initializing');
        isInitialized = true;
        initializeReviewSystem();
    }
}

// Strategy 1: Listen for Smootify loaded event
document.addEventListener('smootify:loaded', () => {
    console.log('Smootify review system: Event received');
    initializeIfReady();
});

// Strategy 2: Check periodically
let checkAttempts = 0;
const maxAttempts = 20;

function checkForSmootify() {
    if (isInitialized || checkAttempts >= maxAttempts) {
        if (checkAttempts >= maxAttempts) {
            console.warn('Smootify review system: Max check attempts reached');
        }
        return;
    }
    
    checkAttempts++;
    initializeIfReady();
    
    if (!isInitialized) {
        setTimeout(checkForSmootify, 250);
    }
}

// Start checking immediately and after a delay
checkForSmootify();
setTimeout(checkForSmootify, 1000);
setTimeout(checkForSmootify, 2000);

// Strategy 3: Apply styles immediately
applyCustomStyles();

// =================================================================================
// Initialization and Data Fetching
// =================================================================================

async function initializeReviewSystem() {
 if (reviewDataStore.isDataFetched) return;

 // Show loading state if possible
 const loadingElements = document.querySelectorAll('[data-loading="reviews"]');
 loadingElements.forEach(el => {
   if (el) el.style.display = 'block';
 });

 try {
     // Try to load from cache first
     const cachedData = cacheManager.load();
     
     if (cachedData) {
         // Use cached data
         reviewDataStore.isDataFetched = true;
         
         // Restore the Map from cached data
         reviewDataStore.reviewsByProductId = new Map();
         cachedData.forEach(([productId, reviews]) => {
             reviewDataStore.reviewsByProductId.set(productId, reviews);
         });
         
         console.log('Smootify reviews: Loaded from cache');
     } else {
         // Fetch fresh data from API
         console.log('Smootify reviews: Fetching fresh data from API');
         const response = await fetchWithRetry(CONFIG.API_URL);
         const allReviews = await response.json();
         reviewDataStore.isDataFetched = true;

         allReviews.forEach(review => {
             const productId = review.Shopify_ID;
             if (!reviewDataStore.reviewsByProductId.has(productId)) {
                 reviewDataStore.reviewsByProductId.set(productId, []);
             }
             reviewDataStore.reviewsByProductId.get(productId).push(review);
         });
         
         // Cache the data for future use
         const dataToCache = Array.from(reviewDataStore.reviewsByProductId.entries());
         cacheManager.save(dataToCache);
     }
     
     populateProductCardRatings();
     
     createProductGridObserver('smootify-search-discovery');
     createProductGridObserver('smootify-search');

     if (window.location.pathname.startsWith('/product/')) {
         setupProductPageReviews();
     }
 } catch (error) {
     console.error("An error occurred while fetching all reviews from Xano:", error);
     
     // Show error state if possible
     const errorElements = document.querySelectorAll('[data-error="reviews"]');
     errorElements.forEach(el => {
       if (el) {
         el.style.display = 'block';
         el.textContent = 'Unable to load reviews. Please try again later.';
       }
     });
 } finally {
     // Hide loading state
     loadingElements.forEach(el => {
       if (el) el.style.display = 'none';
     });
 }
}

// =================================================================================
// Observer for Dynamic Content
// =================================================================================

// Create a single debounced version of our rating function to be shared by all observers.
const debouncedPopulateRatings = debounce(populateProductCardRatings);

// Store observer references for cleanup
const observers = new Set();

function createProductGridObserver(selector) {
 const targetNode = document.querySelector(selector);
 if (!targetNode) return;

 const config = { childList: true, subtree: true };

 // The observer's callback now calls the debounced function, preventing crashes.
 const observer = new MutationObserver(debouncedPopulateRatings);
 
 observer.observe(targetNode, config);
 observers.add(observer);
}

/**
* Cleanup function to disconnect all observers
*/
function cleanupObservers() {
 observers.forEach(observer => {
   observer.disconnect();
 });
 observers.clear();
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupObservers);

// =================================================================================
// Styling Helper Functions
// =================================================================================

/**
* Applies custom CSS styles based on configuration
*/
function applyCustomStyles() {
 const style = document.createElement('style');
 style.textContent = `
   /* Custom star styling */
   [review="productCard_starRating"] svg,
   [review="Product_starRating"] svg,
   [reviewcard="starRating"] svg {
     width: ${CONFIG.STYLING.STARS.SIZE};
     height: ${CONFIG.STYLING.STARS.SIZE};
     transition: fill 0.2s ease-in-out;
   }
   
   [review="productCard_starRating"] svg + svg,
   [review="Product_starRating"] svg + svg,
   [reviewcard="starRating"] svg + svg {
     margin-left: ${CONFIG.STYLING.STARS.SPACING};
   }
   
   /* Enhanced star hover effects */
   [review="productCard_starRating"]:hover svg,
   [review="Product_starRating"]:hover svg,
   [reviewcard="starRating"]:hover svg {
     transform: scale(1.05);
     transition: transform 0.1s ease-in-out;
   }
   
   /* Custom colors for UI elements */
   .review_ui-header {
     color: ${CONFIG.STYLING.COLORS.PRIMARY};
   }
   
   .review_card {
     color: ${CONFIG.STYLING.COLORS.PRIMARY};
   }
   
   .review_ui-filter a {
     color: ${CONFIG.STYLING.COLORS.PRIMARY};
   }
   
   .review_ui-filter a:hover {
     color: ${CONFIG.STYLING.COLORS.HOVER};
   }
   
   .filter-tick {
     color: ${CONFIG.STYLING.COLORS.HOVER};
   }
 `;
 document.head.appendChild(style);
}

// Apply custom styles when the system initializes
document.addEventListener('smootify:loaded', applyCustomStyles);

// =================================================================================
// Precise Star Rating System
// =================================================================================

/**
 * Renders stars with precise decimal ratings (e.g., 2.67 shows as 2 full stars + 67% of 3rd star)
 * @param {Element} starContainer - The container element with star SVGs
 * @param {number} rating - The precise rating (e.g., 2.67)
 */
function renderPreciseStars(starContainer, rating) {
    if (!starContainer) return;
    
    const starSvgPaths = starContainer.querySelectorAll('svg path');
    if (!starSvgPaths.length) return;
    
    // Debug logging for development
    if (rating && rating % 1 !== 0) {
        console.log(`Smootify reviews: Rendering precise stars for rating ${rating.toFixed(2)}`);
        console.log(`Smootify reviews: Full star threshold: ${CONFIG.STYLING.STARS.PRECISE_RATING.FULL_STAR_THRESHOLD}`);
        console.log(`Smootify reviews: Half star threshold: ${CONFIG.STYLING.STARS.PRECISE_RATING.HALF_STAR_THRESHOLD}`);
        
        // Show expected star pattern
        let starPattern = '';
        for (let i = 1; i <= 5; i++) {
            if (rating >= i) {
                starPattern += '★'; // Full star
            } else if (rating >= i - 1) {
                const fillPercentage = rating - (i - 1);
                if (fillPercentage >= CONFIG.STYLING.STARS.PRECISE_RATING.FULL_STAR_THRESHOLD) {
                    starPattern += '★'; // Full star
                } else if (fillPercentage >= CONFIG.STYLING.STARS.PRECISE_RATING.HALF_STAR_THRESHOLD) {
                    starPattern += '☆'; // Half star
                } else {
                    starPattern += '○'; // Empty star
                }
            } else {
                starPattern += '○'; // Empty star
            }
        }
        console.log(`Smootify reviews: Expected pattern: ${starPattern}`);
    }
    
    // Check if simple rounding is enabled
    if (CONFIG.STYLING.STARS.PRECISE_RATING.USE_SIMPLE_ROUNDING) {
        const roundedRating = Math.round(rating);
        starSvgPaths.forEach((path, index) => {
            path.setAttribute('fill', index < roundedRating ? CONFIG.STYLING.STARS.FILLED_COLOR : CONFIG.STYLING.STARS.EMPTY_COLOR);
            path.setAttribute('stroke', CONFIG.STYLING.STARS.STROKE_COLOR);
            path.setAttribute('stroke-width', CONFIG.STYLING.STARS.STROKE_WIDTH);
        });
        return;
    }
    
    // Precise rating system with true partial stars
    starSvgPaths.forEach((path, index) => {
        const starIndex = index + 1; // 1-based index for stars
        const svgElement = path.closest('svg');
        
        if (rating >= starIndex) {
            // Full star
            path.setAttribute('fill', CONFIG.STYLING.STARS.FILLED_COLOR);
            // Remove any existing gradient
            if (svgElement) {
                svgElement.removeAttribute('style');
            }
        } else if (rating >= starIndex - 1) {
            // Partial star - calculate fill percentage
            const fillPercentage = rating - (starIndex - 1);
            
            if (fillPercentage >= CONFIG.STYLING.STARS.PRECISE_RATING.FULL_STAR_THRESHOLD) {
                // Show as full star
                path.setAttribute('fill', CONFIG.STYLING.STARS.FILLED_COLOR);
                if (svgElement) {
                    svgElement.removeAttribute('style');
                }
            } else if (fillPercentage >= CONFIG.STYLING.STARS.PRECISE_RATING.HALF_STAR_THRESHOLD) {
                // Create true partial star with gradient
                createPartialStar(svgElement, path, fillPercentage);
            } else {
                // Empty star
                path.setAttribute('fill', CONFIG.STYLING.STARS.EMPTY_COLOR);
                if (svgElement) {
                    svgElement.removeAttribute('style');
                }
            }
        } else {
            // Empty star
            path.setAttribute('fill', CONFIG.STYLING.STARS.EMPTY_COLOR);
            if (svgElement) {
                svgElement.removeAttribute('style');
            }
        }
        
        // Apply stroke to all stars
        path.setAttribute('stroke', CONFIG.STYLING.STARS.STROKE_COLOR);
        path.setAttribute('stroke-width', CONFIG.STYLING.STARS.STROKE_WIDTH);
    });
}

/**
 * Creates a true partial star using CSS gradient
 * @param {Element} svgElement - The SVG element containing the star
 * @param {Element} pathElement - The path element of the star
 * @param {number} fillPercentage - The percentage to fill (0-1)
 */
function createPartialStar(svgElement, pathElement, fillPercentage) {
    if (!svgElement || !pathElement) return;
    
    // Set the path to use the filled color
    pathElement.setAttribute('fill', CONFIG.STYLING.STARS.FILLED_COLOR);
    
    // Create a gradient that shows the filled color for the percentage and empty color for the rest
    const gradientId = `star-gradient-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create the gradient definition
    const defs = svgElement.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    if (!svgElement.querySelector('defs')) {
        svgElement.insertBefore(defs, svgElement.firstChild);
    }
    
    // Remove any existing gradients
    const existingGradients = defs.querySelectorAll('linearGradient');
    existingGradients.forEach(grad => grad.remove());
    
    // Create new gradient
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', gradientId);
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '0%');
    
    // Add gradient stops
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', `${fillPercentage * 100}%`);
    stop1.setAttribute('stop-color', CONFIG.STYLING.STARS.FILLED_COLOR);
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', `${fillPercentage * 100}%`);
    stop2.setAttribute('stop-color', CONFIG.STYLING.STARS.EMPTY_COLOR);
    
    const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop3.setAttribute('offset', '100%');
    stop3.setAttribute('stop-color', CONFIG.STYLING.STARS.EMPTY_COLOR);
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    gradient.appendChild(stop3);
    defs.appendChild(gradient);
    
    // Apply the gradient to the path
    pathElement.setAttribute('fill', `url(#${gradientId})`);
}

/**
 * Creates a lighter version of a color for partial star fills
 * @param {string} color - The original color (hex, rgb, or named color)
 * @param {number} lightness - How much lighter to make it (0-1)
 * @returns {string} The lighter color
 */
function getLighterColor(color, lightness = 0.3) {
    // Handle named colors
    if (color === 'gold') {
        // For gold, use a more distinct lighter color that's clearly different
        // This creates a more obvious visual difference for partial stars
        return '#FFE5B4'; // Light peach-gold color
    }
    
    // Handle hex colors
    if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const lighterR = Math.min(255, r + (255 - r) * lightness);
        const lighterG = Math.min(255, g + (255 - g) * lightness);
        const lighterB = Math.min(255, b + (255 - b) * lightness);
        
        return `rgb(${Math.round(lighterR)}, ${Math.round(lighterG)}, ${Math.round(lighterB)})`;
    }
    
    // Default fallback
    return color;
}

// =================================================================================
// Logic for Product Card Ratings
// =================================================================================

function populateProductCardRatings() {
 const productCards = document.querySelectorAll(CONFIG.SELECTORS.PRODUCT_CARDS);
 productCards.forEach(card => {
     const productId = card.getAttribute('data-id');
     const reviews = reviewDataStore.reviewsByProductId.get(productId) || [];
     const ratingComponent = card.querySelector(CONFIG.SELECTORS.RATING_COMPONENT);
     
     if (!ratingComponent) return;

     const totalReviews = reviews.length;
     let averageRating = 0;
     if (totalReviews > 0) {
         averageRating = reviews.reduce((acc, r) => acc + r.Review_Rating, 0) / totalReviews;
     }

     const starContainer = ratingComponent.querySelector(CONFIG.SELECTORS.STAR_RATING);
     const totalElement = ratingComponent.querySelector(CONFIG.SELECTORS.REVIEW_TOTAL);

     if (totalElement) totalElement.textContent = totalReviews;
     
     if (starContainer) {
         renderPreciseStars(starContainer, averageRating);
     }
     
     ratingComponent.style.display = 'flex';
 });
}

// =================================================================================
// Logic for the Detailed Product Page Review Section
// =================================================================================

function setupProductPageReviews() {
 const mainProductElement = document.querySelector(CONFIG.SELECTORS.MAIN_PRODUCT);
 
 if (!mainProductElement) {
     console.warn("Could not find the main product element within the <main> tag. Detailed review section will not be initialized.");
     return;
 }
 
 const productId = mainProductElement.getAttribute('data-id');
 const productReviews = reviewDataStore.reviewsByProductId.get(productId) || [];

 toggleReviewSectionVisibility(productReviews);

 if (productReviews.length > 0) {
     updateAggregateRatingDisplay(productReviews);
     renderAverageRatingHeader(productReviews);
     updateFilterCounts(productReviews);
     setupFilterListeners(productReviews);
     applyAndRenderReviews(productReviews);
 }
}

// ... (All other functions below this line remain the same)

function setupFilterListeners(reviewList) {
 const filterLinks = document.querySelectorAll('.review_ui-filter [reviewsort], .review_ui-filter [sort="clear"]');
 filterLinks.forEach(link => {
     link.addEventListener('click', (event) => {
         event.preventDefault();
         if (link.classList.contains('is-disabled')) return;
         const sortType = link.getAttribute('reviewsort') || link.getAttribute('sort');
         if (sortType.includes('stars')) {
             const rating = parseInt(sortType, 10);
             currentSortAndFilter.filterRating = currentSortAndFilter.filterRating === rating ? null : rating;
         } else if (sortType === 'clear') {
             currentSortAndFilter.sort = 'Newest';
             currentSortAndFilter.filterRating = null;
         } else {
             currentSortAndFilter.sort = sortType;
         }
         applyAndRenderReviews(reviewList);
     });
 });
}

function applyAndRenderReviews(baseReviewList) {
 let processedReviews = [...baseReviewList];
 if (currentSortAndFilter.filterRating !== null) {
     processedReviews = processedReviews.filter(review => review.Review_Rating === currentSortAndFilter.filterRating);
 }
 switch (currentSortAndFilter.sort) {
     case 'Oldest': processedReviews.sort((a, b) => a.Review_DateTime - b.Review_DateTime); break;
     case 'Highest': processedReviews.sort((a, b) => b.Review_Rating - a.Review_Rating); break;
     default: processedReviews.sort((a, b) => b.Review_DateTime - a.Review_DateTime); break;
 }
 updateActiveFilterIndicator();
 renderReviews(processedReviews);
}

function toggleReviewSectionVisibility(reviews) {
 const headerEl = document.querySelector(CONFIG.SELECTORS.REVIEW_HEADER);
 const filterEl = document.querySelector(CONFIG.SELECTORS.REVIEW_FILTER);
 const emptyStateEl = document.querySelector(CONFIG.SELECTORS.EMPTY_STATE);
 if (!headerEl || !filterEl || !emptyStateEl) return;
 const hasReviews = reviews.length > 0;
 headerEl.style.display = hasReviews ? 'flex' : 'none';
 filterEl.style.display = hasReviews ? 'block' : 'none';
 emptyStateEl.style.display = hasReviews ? 'none' : 'flex';
}

function updateActiveFilterIndicator() {
 const allFilterLinks = document.querySelectorAll('.review_ui-filter [reviewsort]');
 allFilterLinks.forEach(link => {
     const existingTick = link.querySelector('.filter-tick');
     if (existingTick) existingTick.remove();
 });
 const activeSortLink = document.querySelector(`.review_ui-filter [reviewsort="${currentSortAndFilter.sort}"]`);
 if (activeSortLink) {
     const tick = document.createElement('span');
     tick.className = 'filter-tick';
     tick.textContent = ' ✔';
     activeSortLink.appendChild(tick);
 }
 if (currentSortAndFilter.filterRating !== null) {
     const activeFilterLink = document.querySelector(`.review_ui-filter [reviewsort="${currentSortAndFilter.filterRating} stars"]`);
     if (activeFilterLink && !activeFilterLink.querySelector('.filter-tick')) {
         const tick = document.createElement('span');
         tick.className = 'filter-tick';
         tick.textContent = ' ✔';
         activeFilterLink.appendChild(tick);
     }
 }
}

function updateFilterCounts(reviews) {
 const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
 reviews.forEach(review => {
     if (counts.hasOwnProperty(review.Review_Rating)) counts[review.Review_Rating]++;
 });
 for (let rating = 5; rating >= 1; rating--) {
     const link = document.querySelector(`.review_ui-filter [reviewsort="${rating} stars"]`);
     if (link) {
         const countElement = link.querySelector('div:last-child');
         if (countElement) countElement.textContent = `(${counts[rating]})`;
         link.classList.toggle('is-disabled', counts[rating] === 0);
     }
 }
}

function updateAggregateRatingDisplay(reviews) {
 const ratingComponent = document.querySelector('.review_starrating-component[review="product_rating"]');
 if (!ratingComponent) return;
 const starContainer = ratingComponent.querySelector('[review="Product_starRating"]');
 const totalReviewsElement = ratingComponent.querySelector('[review="product_reviewTotal"]');
 if (!starContainer || !totalReviewsElement) return;

 const totalReviews = reviews.length;
 let averageRating = 0;
 if (totalReviews > 0) averageRating = reviews.reduce((acc, r) => acc + r.Review_Rating, 0) / totalReviews;
 totalReviewsElement.textContent = totalReviews;
 renderPreciseStars(starContainer, averageRating);
}

function renderAverageRatingHeader(reviews) {
 const averageRatingEl = document.querySelector('[reviewui="averageRating"]');
 const starRatingEl = document.querySelector('[reviewui="starRating"]');
 const totalRatingsEl = document.querySelector('[reviewui="ratingsTotal"]');
 const reviewUiHeaderEl = document.querySelector(CONFIG.SELECTORS.REVIEW_HEADER);
 if (!averageRatingEl || !starRatingEl || !totalRatingsEl || !reviewUiHeaderEl) return;
 const totalReviews = reviews.length;
 let preciseAverage = 0;
 if (totalReviews > 0) preciseAverage = reviews.reduce((acc, r) => acc + r.Review_Rating, 0) / totalReviews;
 averageRatingEl.textContent = preciseAverage.toFixed(2);
 totalRatingsEl.textContent = totalReviews;
 renderPreciseStars(starRatingEl, preciseAverage);
 reviewUiHeaderEl.style.opacity = '1';
}

function renderReviews(reviews) {
 const container = document.getElementById(CONFIG.SELECTORS.REVIEWS_CONTAINER.slice(1));
 const templateNode = document.getElementById(CONFIG.SELECTORS.TEMPLATE.slice(1));
 if (!container || !templateNode) return;
 container.innerHTML = '';
 if (!reviews || reviews.length === 0) {
     if (currentSortAndFilter.filterRating !== null) {
         container.innerHTML = `<p>No reviews match the selected filter.</p>`;
     }
     return;
 }
 reviews.forEach((review, index) => {
     const cardClone = templateNode.firstElementChild.cloneNode(true);
     const initialEl = cardClone.querySelector('[reviewcard="initial"]');
     const nameEl = cardClone.querySelector('[reviewcard="name"]');
     const starsContainerEl = cardClone.querySelector('[reviewcard="starRating"]');
     const titleEl = cardClone.querySelector('[reviewcard="title"]');
     const contentEl = cardClone.querySelector('[reviewcard="content"]');
     const timestampEl = cardClone.querySelector('[reviewcard="timestamp"]');
     
     // Add accessibility attributes
     cardClone.setAttribute('role', 'article');
     cardClone.setAttribute('aria-label', `Review by ${review.Review_Name}`);
     
     if (initialEl) initialEl.textContent = review.Review_Name.charAt(0).toUpperCase();
     if (nameEl) nameEl.textContent = review.Review_Name;
     if (titleEl) titleEl.textContent = review.Product;
     if (contentEl) contentEl.textContent = review.Review_Review;
     if (timestampEl) timestampEl.textContent = formatTimeAgo(review.Review_DateTime);
     if (starsContainerEl) {
         const rating = review.Review_Rating;
         
         // Add accessibility for star rating
         starsContainerEl.setAttribute('role', 'img');
         starsContainerEl.setAttribute('aria-label', `${rating} out of 5 stars`);
         
         // Use precise star rendering for individual reviews
         renderPreciseStars(starsContainerEl, rating);
     }
     cardClone.style.visibility = 'hidden';
     container.appendChild(cardClone);
 });
 if (CONFIG.STYLING.ANIMATIONS.ENABLED) {
   gsap.fromTo("#reviews-container .review_card", { y: 30, opacity: 0 }, {
       duration: CONFIG.STYLING.ANIMATIONS.DURATION, 
       y: 0, 
       opacity: 1, 
       visibility: 'visible',
       stagger: CONFIG.STYLING.ANIMATIONS.STAGGER, 
       ease: CONFIG.STYLING.ANIMATIONS.EASE
   });
 } else {
   // If animations are disabled, just show the cards immediately
   document.querySelectorAll("#reviews-container .review_card").forEach(card => {
     card.style.visibility = 'visible';
     card.style.opacity = '1';
   });
 }
}

function formatTimeAgo(timestamp) {
 if (!timestamp) return '';
 const now = new Date();
 const reviewDate = new Date(timestamp);
 const secondsPast = (now.getTime() - reviewDate.getTime()) / 1000;
 
 if (secondsPast < CONFIG.TIME_CONSTANTS.MINUTE) return 'Just now';
 if (secondsPast < CONFIG.TIME_CONSTANTS.HOUR) return `${Math.round(secondsPast / CONFIG.TIME_CONSTANTS.MINUTE)} minutes ago`;
 if (secondsPast < CONFIG.TIME_CONSTANTS.DAY) return `${Math.round(secondsPast / CONFIG.TIME_CONSTANTS.HOUR)} hours ago`;
 if (secondsPast < CONFIG.TIME_CONSTANTS.MONTH) return `${Math.round(secondsPast / CONFIG.TIME_CONSTANTS.DAY)} days ago`;
 if (secondsPast < CONFIG.TIME_CONSTANTS.YEAR) {
     const months = Math.round(secondsPast / CONFIG.TIME_CONSTANTS.MONTH);
     return months <= 1 ? '1 month ago' : `${months} months ago`;
 }
   const years = Math.round(secondsPast / CONFIG.TIME_CONSTANTS.YEAR);
  return years <= 1 ? '1 year ago' : `${years} years ago`;
}

})(); // Close the IIFE
