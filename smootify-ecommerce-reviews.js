// =================================================================================
// Review System - Smootify E-commerce Reviews
// =================================================================================

console.log('Review system script loading...');

// Immediately expose a test function to verify script loading
window.scriptLoadedTest = function() {
  console.log('✅ Script is definitely loaded!');
  return 'SCRIPT_LOADED';
};

// =================================================================================
// Configuration and Constants
// =================================================================================

const CONFIG = {
  API_URL: 'https://x8ki-letl-twmt.n7.xano.io/api:LDyz3cwj/ALL_product_reviews',
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  DEBOUNCE_DELAY: 250,
  BATCH_SIZE: 20,
  LAZY_LOAD_MARGIN: '100px'
};

// =================================================================================
// Global State & Data Store with Caching
// =================================================================================

const reviewDataStore = {
  reviewsByProductId: new Map(),
  isDataFetched: false,
  cacheTimestamp: null,
  totalReviews: 0,
  ratingIndex: new Map() // productId -> { 1: count, 2: count, ... }
};

let currentSortAndFilter = {
  sort: 'Newest',
  filterRating: null
};

// Performance monitoring
const performanceMetrics = {
  apiLoadTime: 0,
  renderTime: 0,
  domOperations: 0
};

// =================================================================================
// Caching System
// =================================================================================

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
  }

  set(key, data, duration = CONFIG.CACHE_DURATION) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now() + duration);
  }

  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() > timestamp) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }
}

const cacheManager = new CacheManager();

// =================================================================================
// Optimized Helper Functions
// =================================================================================

/**
* Enhanced debounce with immediate execution option
*/
function debounce(func, delay = CONFIG.DEBOUNCE_DELAY, immediate = false) {
  let timeoutId;
  return function(...args) {
    const callNow = immediate && !timeoutId;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) func.apply(this, args);
    }, delay);
    if (callNow) func.apply(this, args);
  };
}

/**
* Request Animation Frame batching for DOM operations
*/
function batchDOMOperations(operations) {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      operations.forEach(op => op());
      resolve();
    });
  });
}

/**
* Intersection Observer for lazy loading
*/
const lazyLoadObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const productId = element.getAttribute('data-id');
        if (productId && !element.hasAttribute('data-ratings-loaded')) {
          loadProductRating(element, productId);
          element.setAttribute('data-ratings-loaded', 'true');
          lazyLoadObserver.unobserve(element);
        }
      }
    });
  },
  { rootMargin: CONFIG.LAZY_LOAD_MARGIN }
);

// =================================================================================
// Main Execution Block
// =================================================================================

// Listen for Smootify loading events
document.addEventListener('smootify:loaded', initializeReviewSystem);

// Also listen for DOM changes that might indicate Smootify re-rendering
const smootifyObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      // Check if new product cards were added
      const hasNewCards = Array.from(mutation.addedNodes).some(node => 
        node.nodeType === 1 && (
          node.matches('smootify-product[data-id]') || 
          node.querySelector('smootify-product[data-id]')
        )
      );
      
      if (hasNewCards) {
        console.log('New product cards detected, re-initializing ratings...');
        setTimeout(() => {
          setupLazyLoadedRatings();
          // Force load ratings for all visible cards
          const allCards = document.querySelectorAll('smootify-product[data-id], .sm-product[data-id]');
          allCards.forEach(card => {
            const productId = card.getAttribute('data-id');
            if (productId && productId !== 'search') {
              loadProductRating(card, productId);
            }
          });
        }, 100);
      }
    }
  });
});

// Start observing the document for Smootify changes
smootifyObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// Also try to initialize immediately if the event doesn't fire
setTimeout(() => {
  if (!reviewDataStore.isDataFetched) {
    console.log('No smootify:loaded event detected, initializing manually...');
    initializeReviewSystem();
  }
}, 1000);

// =================================================================================
// Optimized Initialization and Data Fetching
// =================================================================================

async function initializeReviewSystem() {
  if (reviewDataStore.isDataFetched) return;
  
  const startTime = performance.now();
  
  // Check cache first
  const cachedData = cacheManager.get('allReviews');
  if (cachedData) {
    console.log('Using cached data');
    processReviewData(cachedData);
    setupUI();
    return;
  }

  try {
    console.log('Fetching reviews from API...');
    const allReviews = await fetchReviewsWithRetry();
    console.log('Fetched reviews:', allReviews.length);
    
    // Cache the response
    cacheManager.set('allReviews', allReviews);
    
    processReviewData(allReviews);
    setupUI();
    
    performanceMetrics.apiLoadTime = performance.now() - startTime;
    console.log(`Reviews loaded and processed in ${performanceMetrics.apiLoadTime.toFixed(2)}ms`);
    
  } catch (error) {
    console.error("Failed to initialize review system:", error);
  }
}

async function fetchReviewsWithRetry(maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(CONFIG.API_URL);
      if (!response.ok) throw new Error(`API responded with status: ${response.status}`);
      
      const allReviews = await response.json();
      return allReviews;
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
}

function processReviewData(allReviews) {
  reviewDataStore.isDataFetched = true;
  reviewDataStore.totalReviews = allReviews.length;
  reviewDataStore.cacheTimestamp = Date.now();

  // Process reviews in batches to avoid blocking the main thread
  const batchSize = CONFIG.BATCH_SIZE;
  let processed = 0;

  function processBatch() {
    const batch = allReviews.slice(processed, processed + batchSize);
    
    batch.forEach(review => {
      const productId = review.Shopify_ID;
      
      // Store review
      if (!reviewDataStore.reviewsByProductId.has(productId)) {
        reviewDataStore.reviewsByProductId.set(productId, []);
        reviewDataStore.ratingIndex.set(productId, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      }
      
      reviewDataStore.reviewsByProductId.get(productId).push(review);
      
      // Update rating index for fast filtering
      const ratingCounts = reviewDataStore.ratingIndex.get(productId);
      ratingCounts[review.Review_Rating]++;
    });

    processed += batchSize;

    if (processed < allReviews.length) {
      // Use setTimeout to yield to the main thread
      setTimeout(processBatch, 0);
    }
  }

  processBatch();
}

function setupUI() {
  // Use lazy loading for product card ratings
  setupLazyLoadedRatings();
  
  // Setup observers for dynamic content
  createProductGridObserver('smootify-search-discovery');
  createProductGridObserver('smootify-search');

  // Setup product page if we're on one
  if (window.location.pathname.startsWith('/product/')) {
    setupProductPageReviews();
  }
}

// =================================================================================
// Optimized Observer for Dynamic Content
// =================================================================================

const debouncedSetupLazyRatings = debounce(setupLazyLoadedRatings, 300);

function createProductGridObserver(selector) {
  const targetNode = document.querySelector(selector);
  if (!targetNode) return;

  const config = { childList: true, subtree: true };
  const observer = new MutationObserver(debouncedSetupLazyRatings);
  observer.observe(targetNode, config);
}

// =================================================================================
// Optimized Product Card Ratings with Lazy Loading
// =================================================================================

function setupLazyLoadedRatings() {
  const productCards = document.querySelectorAll('smootify-product[data-id], .sm-product[data-id]');
  
  productCards.forEach(card => {
    if (!card.hasAttribute('data-ratings-observed')) {
      lazyLoadObserver.observe(card);
      card.setAttribute('data-ratings-observed', 'true');
    }
  });
}

function loadProductRating(card, productId) {
  console.log('loadProductRating called for productId:', productId);
  
  const reviews = reviewDataStore.reviewsByProductId.get(productId) || [];
  const ratingComponent = card.querySelector('[review="productCard_rating"]');
  
  console.log('Found reviews:', reviews.length);
  console.log('Found ratingComponent:', !!ratingComponent);
  
  if (!ratingComponent) {
    console.warn('No rating component found for product:', productId);
    return;
  }

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? Math.round(reviews.reduce((acc, r) => acc + r.Review_Rating, 0) / totalReviews) 
    : 0;

  console.log('Calculated averageRating:', averageRating, 'totalReviews:', totalReviews);

  // Batch DOM operations
  batchDOMOperations([
    () => updateRatingDisplay(ratingComponent, averageRating, totalReviews)
  ]);
}

function updateRatingDisplay(ratingComponent, averageRating, totalReviews) {
  console.log('updateRatingDisplay called with averageRating:', averageRating, 'totalReviews:', totalReviews);
  
  const starContainer = ratingComponent.querySelector('[review="productCard_starRating"]');
  const totalElement = ratingComponent.querySelector('[review="productCard_reviewTotal"]');

  console.log('Found starContainer:', !!starContainer);
  console.log('Found totalElement:', !!totalElement);

  if (totalElement) {
    totalElement.textContent = totalReviews;
    console.log('Updated total reviews to:', totalReviews);
  }
  
  if (starContainer) {
    console.log('Calling updateStarRating with container:', starContainer);
    updateStarRating(starContainer, averageRating);
  } else {
    console.warn('No star container found in rating component');
  }
  
  ratingComponent.style.display = 'flex';
  performanceMetrics.domOperations++;
  console.log('Rating display updated successfully');
}

// =================================================================================
// Optimized Star Rating System
// =================================================================================

function updateStarRating(container, rating) {
  console.log('updateStarRating called with rating:', rating, 'container:', container);
  
  // Find all SVG elements (each is a star)
  const starSvgs = container.querySelectorAll('svg');
  console.log('Found star SVGs:', starSvgs.length);
  
  if (starSvgs.length === 0) {
    console.warn('No star SVGs found in container:', container);
    console.log('Container HTML:', container.innerHTML);
    return;
  }
  
  console.log('Updating', starSvgs.length, 'star SVGs with rating:', rating);
  
  // Update each SVG star
  starSvgs.forEach((svg, index) => {
    const path = svg.querySelector('path');
    if (!path) {
      console.warn(`No path found in SVG ${index + 1}`);
      return;
    }
    
    if (index < rating) {
      // Filled star - use a bright gold color that's more visible
      path.setAttribute('fill', '#FFD700'); // Bright gold
      path.setAttribute('stroke', '#000000'); // Black stroke
      path.setAttribute('stroke-width', '15'); // Keep original stroke width
      console.log(`Star ${index + 1}: filled with gold`);
    } else {
      // Empty star - use transparent fill with visible stroke
      path.setAttribute('fill', 'none'); // No fill for empty stars
      path.setAttribute('stroke', '#000000'); // Black stroke
      path.setAttribute('stroke-width', '15'); // Keep original stroke width
      console.log(`Star ${index + 1}: empty with stroke`);
    }
  });
  
  // Mark the container as updated to prevent re-overwriting
  container.setAttribute('data-rating-updated', rating.toString());
  
  // Force a repaint to ensure changes are visible
  container.style.display = 'none';
  container.offsetHeight; // Trigger reflow
  container.style.display = '';
  
  // Set up a periodic check to ensure stars stay updated
  setTimeout(() => {
    const currentRating = container.getAttribute('data-rating-updated');
    if (currentRating && parseInt(currentRating) === rating) {
      // Re-apply the rating if it was reset
      const paths = container.querySelectorAll('path');
      paths.forEach((path, index) => {
        if (index < rating) {
          path.setAttribute('fill', '#FFD700');
        } else {
          path.setAttribute('fill', 'none');
        }
      });
    }
  }, 500);
}

// Function to create stars if they don't exist (not needed since stars are already in HTML)
function createStars(container) {
  console.log('Stars are already in HTML, no need to create them');
  return;
}

// =================================================================================
// Optimized Product Page Reviews
// =================================================================================

function setupProductPageReviews() {
  const mainProductElement = document.querySelector('main smootify-product[data-id]:not([data-parent-id])');
  
  if (!mainProductElement) {
    console.warn("Could not find the main product element. Review section not initialized.");
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

// =================================================================================
// Optimized Filter and Sort System
// =================================================================================

function setupFilterListeners(reviewList) {
  const filterLinks = document.querySelectorAll('.review_ui-filter [reviewsort], .review_ui-filter [sort="clear"]');
  
  filterLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (link.classList.contains('is-disabled')) return;
      
      handleFilterChange(link, reviewList);
    });
  });
}

function handleFilterChange(link, reviewList) {
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
}

function applyAndRenderReviews(baseReviewList) {
  const startTime = performance.now();
  
  let processedReviews = [...baseReviewList];
  
  // Efficient filtering using pre-computed indices
  if (currentSortAndFilter.filterRating !== null) {
    processedReviews = processedReviews.filter(review => 
      review.Review_Rating === currentSortAndFilter.filterRating
    );
  }
  
  // Optimized sorting
  switch (currentSortAndFilter.sort) {
    case 'Oldest': 
      processedReviews.sort((a, b) => a.Review_DateTime - b.Review_DateTime); 
      break;
    case 'Highest': 
      processedReviews.sort((a, b) => b.Review_Rating - a.Review_Rating); 
      break;
    default: 
      processedReviews.sort((a, b) => b.Review_DateTime - a.Review_DateTime); 
      break;
  }
  
  updateActiveFilterIndicator();
  renderReviews(processedReviews);
  
  performanceMetrics.renderTime = performance.now() - startTime;
}

// =================================================================================
// Optimized Rendering Functions
// =================================================================================

function renderReviews(reviews) {
  const container = document.getElementById('reviews-container');
  const templateNode = document.getElementById('review-card-template');
  
  if (!container || !templateNode) return;
  
  // Use document fragment for efficient DOM manipulation
  const fragment = document.createDocumentFragment();
  
  if (!reviews || reviews.length === 0) {
    if (currentSortAndFilter.filterRating !== null) {
      container.innerHTML = `<p>No reviews match the selected filter.</p>`;
    }
    return;
  }
  
  // Batch create all cards
  reviews.forEach(review => {
    const cardClone = templateNode.firstElementChild.cloneNode(true);
    populateReviewCard(cardClone, review);
    fragment.appendChild(cardClone);
  });
  
  // Single DOM operation
  container.innerHTML = '';
  container.appendChild(fragment);
  
  // Animate with optimized GSAP
  if (window.gsap) {
    gsap.set("#reviews-container .review_card", { y: 30, opacity: 0, visibility: 'hidden' });
    gsap.to("#reviews-container .review_card", {
      duration: 0.6, 
      y: 0, 
      opacity: 1, 
      visibility: 'visible',
      stagger: 0.05, // Reduced stagger for better performance
      ease: "power2.out" // Simplified easing
    });
  }
}

function populateReviewCard(card, review) {
  const updates = [
    { selector: '[reviewcard="initial"]', content: review.Review_Name.charAt(0).toUpperCase() },
    { selector: '[reviewcard="name"]', content: review.Review_Name },
    { selector: '[reviewcard="title"]', content: review.Product },
    { selector: '[reviewcard="content"]', content: review.Review_Review },
    { selector: '[reviewcard="timestamp"]', content: formatTimeAgo(review.Review_DateTime) }
  ];
  
  // Batch all text updates
  batchDOMOperations([
    () => {
      updates.forEach(({ selector, content }) => {
        const element = card.querySelector(selector);
        if (element) element.textContent = content;
      });
    }
  ]);
  
  // Update stars efficiently
  const starsContainer = card.querySelector('[reviewcard="starRating"]');
  if (starsContainer) {
    updateStarRating(starsContainer, review.Review_Rating);
  }
}

// =================================================================================
// Preserved Original Functions (Optimized)
// =================================================================================

function toggleReviewSectionVisibility(reviews) {
  const elements = [
    { selector: '.review_ui-header', show: reviews.length > 0 },
    { selector: '.review_ui-filter', show: reviews.length > 0 },
    { selector: '.review-empty', show: reviews.length === 0 }
  ];
  
  batchDOMOperations([
    () => {
      elements.forEach(({ selector, show }) => {
        const element = document.querySelector(selector);
        if (element) {
          element.style.display = show ? (selector.includes('header') ? 'flex' : 'block') : 'none';
        }
      });
    }
  ]);
}

function updateActiveFilterIndicator() {
  // Remove existing ticks efficiently
  const existingTicks = document.querySelectorAll('.filter-tick');
  existingTicks.forEach(tick => tick.remove());
  
  // Add new ticks
  const activeSortLink = document.querySelector(`.review_ui-filter [reviewsort="${currentSortAndFilter.sort}"]`);
  if (activeSortLink) {
    addFilterTick(activeSortLink);
  }
  
  if (currentSortAndFilter.filterRating !== null) {
    const activeFilterLink = document.querySelector(`.review_ui-filter [reviewsort="${currentSortAndFilter.filterRating} stars"]`);
    if (activeFilterLink) {
      addFilterTick(activeFilterLink);
    }
  }
}

function addFilterTick(link) {
  const tick = document.createElement('span');
  tick.className = 'filter-tick';
  tick.textContent = ' ✔';
  link.appendChild(tick);
}

function updateFilterCounts(reviews) {
  const productId = document.querySelector('main smootify-product[data-id]')?.getAttribute('data-id');
  const counts = reviewDataStore.ratingIndex.get(productId) || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  
  // Batch update all filter counts
  batchDOMOperations([
    () => {
      for (let rating = 5; rating >= 1; rating--) {
        const link = document.querySelector(`.review_ui-filter [reviewsort="${rating} stars"]`);
        if (link) {
          const countElement = link.querySelector('div:last-child');
          if (countElement) {
            countElement.textContent = `(${counts[rating]})`;
          }
          link.classList.toggle('is-disabled', counts[rating] === 0);
        }
      }
    }
  ]);
}

function updateAggregateRatingDisplay(reviews) {
  const ratingComponent = document.querySelector('.review_starrating-component[review="product_rating"]');
  if (!ratingComponent) return;
  
  const starContainer = ratingComponent.querySelector('[review="Product_starRating"]');
  const totalReviewsElement = ratingComponent.querySelector('[review="product_reviewTotal"]');
  
  if (!starContainer || !totalReviewsElement) return;

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? Math.round(reviews.reduce((acc, r) => acc + r.Review_Rating, 0) / totalReviews) 
    : 0;
  
  batchDOMOperations([
    () => {
      totalReviewsElement.textContent = totalReviews;
      updateStarRating(starContainer, averageRating);
    }
  ]);
}

function renderAverageRatingHeader(reviews) {
  const elements = {
    average: document.querySelector('[reviewui="averageRating"]'),
    stars: document.querySelector('[reviewui="starRating"]'),
    total: document.querySelector('[reviewui="ratingsTotal"]'),
    header: document.querySelector('.review_ui-header')
  };
  
  if (!Object.values(elements).every(el => el)) return;
  
  const totalReviews = reviews.length;
  const preciseAverage = totalReviews > 0 
    ? reviews.reduce((acc, r) => acc + r.Review_Rating, 0) / totalReviews 
    : 0;
  const roundedAverage = Math.round(preciseAverage);
  
  batchDOMOperations([
    () => {
      elements.average.textContent = preciseAverage.toFixed(2);
      elements.total.textContent = totalReviews;
      updateStarRating(elements.stars, roundedAverage);
      elements.header.style.opacity = '1';
    }
  ]);
}

// Cached and optimized time formatting
const timeFormatCache = new Map();

function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  
  // Check cache first
  const cacheKey = `${timestamp}_${Math.floor(Date.now() / 60000)}`; // Cache for 1 minute
  if (timeFormatCache.has(cacheKey)) {
    return timeFormatCache.get(cacheKey);
  }
  
  const now = Date.now();
  const reviewDate = new Date(timestamp).getTime();
  const secondsPast = (now - reviewDate) / 1000;
  
  let result;
  if (secondsPast < 60) result = 'Just now';
  else if (secondsPast < 3600) result = `${Math.round(secondsPast / 60)} minutes ago`;
  else if (secondsPast < 86400) result = `${Math.round(secondsPast / 3600)} hours ago`;
  else if (secondsPast < 2592000) result = `${Math.round(secondsPast / 86400)} days ago`;
  else if (secondsPast < 31536000) {
    const months = Math.round(secondsPast / 2592000);
    result = months <= 1 ? '1 month ago' : `${months} months ago`;
  } else {
    const years = Math.round(secondsPast / 31536000);
    result = years <= 1 ? '1 year ago' : `${years} years ago`;
  }
  
  timeFormatCache.set(cacheKey, result);
  
  // Limit cache size
  if (timeFormatCache.size > 1000) {
    const firstKey = timeFormatCache.keys().next().value;
    timeFormatCache.delete(firstKey);
  }
  
  return result;
}

// =================================================================================
// Performance Monitoring
// =================================================================================

function logPerformanceMetrics() {
  if (window.console && console.table) {
    console.table({
      'API Load Time (ms)': performanceMetrics.apiLoadTime.toFixed(2),
      'Render Time (ms)': performanceMetrics.renderTime.toFixed(2),
      'DOM Operations': performanceMetrics.domOperations,
      'Total Reviews': reviewDataStore.totalReviews,
      'Memory Usage (MB)': (performance.memory?.usedJSHeapSize / 1048576).toFixed(2) || 'N/A'
    });
  }
}

// Log metrics every 30 seconds in development
if (window.location.hostname === 'localhost') {
  setInterval(logPerformanceMetrics, 30000);
}

// =================================================================================
// Memory Management and Cleanup
// =================================================================================

function cleanup() {
  // Clear observers
  lazyLoadObserver.disconnect();
  
  // Clear caches
  cacheManager.clear();
  timeFormatCache.clear();
  
  // Clear performance metrics
  Object.keys(performanceMetrics).forEach(key => {
    performanceMetrics[key] = 0;
  });
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);

// Set up periodic rating restoration to prevent Smootify from overwriting our changes
setInterval(() => {
  if (reviewDataStore.isDataFetched) {
    const allCards = document.querySelectorAll('smootify-product[data-id], .sm-product[data-id]');
    allCards.forEach(card => {
      const productId = card.getAttribute('data-id');
      if (productId && productId !== 'search') {
        const ratingComponent = card.querySelector('[review="productCard_rating"]');
        if (ratingComponent) {
          const starContainer = ratingComponent.querySelector('[review="productCard_starRating"]');
          if (starContainer) {
            const expectedRating = starContainer.getAttribute('data-rating-updated');
            if (expectedRating) {
              // Check if stars were reset
              const paths = starContainer.querySelectorAll('path');
              const firstPath = paths[0];
              if (firstPath && firstPath.getAttribute('fill') === 'none' && parseInt(expectedRating) > 0) {
                console.log('Detected stars were reset, restoring rating:', expectedRating);
                updateStarRating(starContainer, parseInt(expectedRating));
              }
            }
          }
        }
      }
    });
  }
}, 2000); // Check every 2 seconds

// =================================================================================
// Debugging and Testing Functions
// =================================================================================

// Function to manually test star rendering
function testStarRendering() {
  console.log('=== TESTING STAR RENDERING ===');
  
  // Find all star containers
  const starContainers = document.querySelectorAll('[review="productCard_starRating"]');
  console.log('Found star containers:', starContainers.length);
  
  starContainers.forEach((container, index) => {
    console.log(`\n--- Testing Container ${index + 1} ---`);
    console.log('Container:', container);
    console.log('Container HTML:', container.innerHTML);
    
    // Test with different ratings
    [0, 1, 2, 3, 4, 5].forEach(rating => {
      console.log(`\nTesting rating: ${rating}`);
      updateStarRating(container, rating);
      
      // Check the results
      const paths = container.querySelectorAll('path');
      paths.forEach((path, pathIndex) => {
        const fill = path.getAttribute('fill');
        const stroke = path.getAttribute('stroke');
        console.log(`  Path ${pathIndex + 1}: fill="${fill}", stroke="${stroke}"`);
      });
    });
  });
}

// Function to check if stars are visible
function checkStarVisibility() {
  console.log('=== CHECKING STAR VISIBILITY ===');
  
  const starContainers = document.querySelectorAll('[review="productCard_starRating"]');
  starContainers.forEach((container, index) => {
    console.log(`\nContainer ${index + 1}:`);
    console.log('Container visible:', container.offsetWidth > 0 && container.offsetHeight > 0);
    console.log('Container style:', container.style.cssText);
    
    const paths = container.querySelectorAll('path');
    paths.forEach((path, pathIndex) => {
      const fill = path.getAttribute('fill');
      const stroke = path.getAttribute('stroke');
      const strokeWidth = path.getAttribute('stroke-width');
      console.log(`  Path ${pathIndex + 1}: fill="${fill}", stroke="${stroke}", stroke-width="${strokeWidth}"`);
    });
  });
}

// Make debugging functions available globally
window.testStarRendering = testStarRendering;
window.checkStarVisibility = checkStarVisibility;

// Simple test function to verify script is loaded
function testScriptLoaded() {
  console.log('Script is loaded!');
  console.log('CONFIG:', CONFIG);
  console.log('reviewDataStore:', reviewDataStore);
  return true;
}

// Make test function available globally
window.testScriptLoaded = testScriptLoaded;

// Function to manually test star rating update
function testStarRating() {
  console.log('Testing star rating update...');
  const ratingComponent = document.querySelector('[review="productCard_rating"]');
  if (ratingComponent) {
    console.log('Found rating component:', ratingComponent);
    updateRatingDisplay(ratingComponent, 3, 5);
  } else {
    console.log('No rating component found');
  }
}

// Make test function available globally
window.testStarRating = testStarRating;

// Force expose all debugging functions to global scope
window.testScriptLoaded = testScriptLoaded;
window.testStarRating = testStarRating;
window.testStarRendering = testStarRendering;
window.checkStarVisibility = checkStarVisibility;

// Also expose main functions for debugging
window.updateStarRating = updateStarRating;
window.updateRatingDisplay = updateRatingDisplay;
window.loadProductRating = loadProductRating;

// Create a simple test function that's guaranteed to work
window.simpleTest = function() {
  console.log('✅ Simple test function works!');
  console.log('CONFIG available:', typeof CONFIG !== 'undefined');
  console.log('reviewDataStore available:', typeof reviewDataStore !== 'undefined');
  return 'SUCCESS';
};

console.log('Review system script loaded successfully!');
console.log('Debugging functions available:', {
  testScriptLoaded: typeof testScriptLoaded,
  testStarRating: typeof testStarRating,
  testStarRendering: typeof testStarRendering,
  checkStarVisibility: typeof checkStarVisibility,
  simpleTest: typeof window.simpleTest
});

// Final verification that functions are exposed
setTimeout(() => {
  console.log('=== FINAL VERIFICATION ===');
  console.log('window.testScriptLoaded:', typeof window.testScriptLoaded);
  console.log('window.simpleTest:', typeof window.simpleTest);
  console.log('window.CONFIG:', typeof window.CONFIG);
}, 100);

// Force expose debugging functions immediately
(function() {
  // Create debugging functions that are guaranteed to work
  window.debugReviewSystem = function() {
    console.log('=== REVIEW SYSTEM DEBUG ===');
    console.log('CONFIG:', CONFIG);
    console.log('reviewDataStore:', reviewDataStore);
    console.log('updateStarRating available:', typeof updateStarRating);
    console.log('updateRatingDisplay available:', typeof updateRatingDisplay);
    return 'DEBUG_COMPLETE';
  };

  window.testStarRating = function() {
    console.log('=== TESTING STAR RATING ===');
    const ratingComponent = document.querySelector('[review="productCard_rating"]');
    if (ratingComponent) {
      console.log('Found rating component:', ratingComponent);
      updateRatingDisplay(ratingComponent, 3, 5);
      return 'STAR_TEST_COMPLETE';
    } else {
      console.log('No rating component found');
      return 'NO_RATING_COMPONENT';
    }
  };

  window.forceLoadRatings = function() {
    console.log('=== FORCING RATING LOAD ===');
    const productCards = document.querySelectorAll('smootify-product[data-id], .sm-product[data-id]');
    console.log('Found product cards:', productCards.length);
    
    productCards.forEach((card, index) => {
      const productId = card.getAttribute('data-id');
      console.log(`Card ${index + 1}:`, productId);
      if (productId) {
        loadProductRating(card, productId);
      }
    });
    return 'RATINGS_FORCED';
  };

  console.log('✅ Debugging functions exposed:', {
    debugReviewSystem: typeof window.debugReviewSystem,
    testStarRating: typeof window.testStarRating,
    forceLoadRatings: typeof window.forceLoadRatings
  });
  
  // Function to ensure all rating components are visible and have stars
  window.ensureAllRatingsVisible = function() {
    console.log('=== ENSURING ALL RATINGS ARE VISIBLE ===');
    const allProductCards = document.querySelectorAll('smootify-product[data-id], .sm-product[data-id]');
    console.log('Found product cards:', allProductCards.length);
    
    allProductCards.forEach((card, index) => {
      const productId = card.getAttribute('data-id');
      if (productId && productId !== 'search') {
        console.log(`Processing card ${index + 1}:`, productId);
        
        const ratingComponent = card.querySelector('[review="productCard_rating"]');
        if (ratingComponent) {
          // Make rating component visible
          ratingComponent.style.visibility = 'visible';
          ratingComponent.style.display = 'flex';
          
          const starContainer = ratingComponent.querySelector('[review="productCard_starRating"]');
          if (starContainer) {
            // Make star container visible
            starContainer.style.visibility = 'visible';
            
            // Create stars if they don't exist
            if (!starContainer.querySelector('path')) {
              console.log(`Creating stars for card ${index + 1}`);
              createStars(starContainer);
            }
            
            // Load rating data
            loadProductRating(card, productId);
          }
        }
      }
    });
    
    console.log('All ratings should now be visible!');
    return 'RATINGS_VISIBLE';
  };
})();
