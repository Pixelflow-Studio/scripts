// =================================================================================
// Configuration and Constants
// =================================================================================

const CONFIG = {
  API_URL: 'https://x8ki-letl-twmt.n7.xano.io/api:LDyz3cwj/ALL_product_reviews',
  DEBOUNCE_DELAY: 250,
  VIRTUAL_SCROLL_THRESHOLD: 50, // Start virtual scrolling after 50 items
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes cache
  LAZY_LOAD_MARGIN: '100px',
  BATCH_SIZE: 20 // Process reviews in batches
};

// =================================================================================
// Enhanced Global State & Data Store with Caching
// =================================================================================

const reviewDataStore = {
  reviewsByProductId: new Map(),
  isDataFetched: false,
  cacheTimestamp: null,
  totalReviews: 0,
  // Index for fast lookups
  ratingIndex: new Map(), // productId -> { 1: count, 2: count, ... }
  // Virtual scrolling state
  virtualScrollState: {
      visibleStart: 0,
      visibleEnd: 20,
      itemHeight: 150,
      containerHeight: 0
  }
};

let currentSortAndFilter = {
  sort: 'Newest',
  filterRating: null
};

// Performance monitoring
const performanceMetrics = {
  apiLoadTime: 0,
  renderTime: 0,
  domOperations: 0,
  memoryUsage: 0
};

// =================================================================================
// Utility Functions
// =================================================================================

/**
* Enhanced debounce with immediate execution option
*/
function debounce(func, delay = 250, immediate = false) {
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
* Memory-efficient object pool for review cards
*/
class ReviewCardPool {
  constructor(initialSize = 10) {
      this.pool = [];
      this.used = new Set();
      this.template = null;
      this.initialize(initialSize);
  }

  initialize(size) {
      for (let i = 0; i < size; i++) {
          this.createCard();
      }
  }

  createCard() {
      if (!this.template) {
          this.template = document.getElementById('review-card-template');
          if (!this.template) return null;
      }
      
      const card = this.template.firstElementChild.cloneNode(true);
      card.style.position = 'absolute';
      card.style.willChange = 'transform';
      this.pool.push(card);
      return card;
  }

  getCard() {
      let card = this.pool.find(c => !this.used.has(c));
      if (!card) {
          card = this.createCard();
      }
      if (card) {
          this.used.add(card);
      }
      return card;
  }

  releaseCard(card) {
      this.used.delete(card);
      card.style.transform = '';
      card.style.visibility = 'hidden';
  }

  releaseAll() {
      this.used.clear();
      this.pool.forEach(card => {
          card.style.transform = '';
          card.style.visibility = 'hidden';
      });
  }
}

const cardPool = new ReviewCardPool();

/**
* Intersection Observer for lazy loading
*/
const lazyLoadObserver = new IntersectionObserver(
  (entries) => {
      console.log('Intersection observer triggered with entries:', entries.length);
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              const element = entry.target;
              const productId = element.getAttribute('data-id');
              console.log('Element intersecting:', element, 'productId:', productId);
              if (productId && !element.hasAttribute('data-ratings-loaded')) {
                  console.log('Loading rating for product:', productId);
                  loadProductRating(element, productId);
                  element.setAttribute('data-ratings-loaded', 'true');
                  lazyLoadObserver.unobserve(element);
              } else {
                  console.log('Skipping element - no productId or already loaded');
              }
          }
      });
  },
  { rootMargin: CONFIG.LAZY_LOAD_MARGIN }
);

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
// Main Execution Block
// =================================================================================

document.addEventListener('smootify:loaded', initializeReviewSystem);

// =================================================================================
// Enhanced Initialization and Data Fetching
// =================================================================================

async function initializeReviewSystem() {
  console.log('initializeReviewSystem called');
  const startTime = performance.now();
  
  // Check cache first
  const cachedData = cacheManager.get('allReviews');
  if (cachedData && reviewDataStore.isDataFetched) {
      console.log('Using cached data');
      setupUI();
      return;
  }

  if (reviewDataStore.isDataFetched) {
      console.log('Data already fetched, skipping');
      return;
  }

  try {
      console.log('Fetching reviews from API...');
      const allReviews = await fetchReviewsWithRetry();
      console.log('Fetched reviews:', allReviews.length);
      processReviewData(allReviews);
      setupUI();
      
      performanceMetrics.apiLoadTime = performance.now() - startTime;
      console.log(`Reviews loaded and processed in ${performanceMetrics.apiLoadTime.toFixed(2)}ms`);
      
  } catch (error) {
      console.error("Failed to initialize review system:", error);
      showErrorState();
  }
}

async function fetchReviewsWithRetry(maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
      try {
          const response = await fetch(CONFIG.API_URL);
          if (!response.ok) throw new Error(`API responded with status: ${response.status}`);
          
          const allReviews = await response.json();
          
          // Cache the response
          cacheManager.set('allReviews', allReviews);
          
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
// Enhanced Observer for Dynamic Content
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
  console.log('setupLazyLoadedRatings found productCards:', productCards.length);
  
  if (productCards.length === 0) {
      console.log('No product cards found. Trying alternative selectors...');
      const alternativeCards = document.querySelectorAll('[data-id]');
      console.log('Alternative cards found:', alternativeCards.length);
      alternativeCards.forEach(card => {
          console.log('Alternative card:', card.tagName, card.getAttribute('data-id'));
      });
  }
  
  productCards.forEach(card => {
      if (!card.hasAttribute('data-ratings-observed')) {
          console.log('Setting up lazy loading for card:', card);
          console.log('Card data-id:', card.getAttribute('data-id'));
          lazyLoadObserver.observe(card);
          card.setAttribute('data-ratings-observed', 'true');
      }
  });
}

function loadProductRating(card, productId) {
  console.log('loadProductRating called for productId:', productId);
  const reviews = reviewDataStore.reviewsByProductId.get(productId) || [];
  const ratingComponent = card.querySelector('[review="productCard_rating"]');
  
  console.log('Found reviews:', reviews.length, 'ratingComponent:', ratingComponent);
  
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

  console.log('Found starContainer:', starContainer, 'totalElement:', totalElement);

  if (totalElement) {
      totalElement.textContent = totalReviews;
      console.log('Updated total reviews text');
  }
  
  if (starContainer) {
      console.log('Calling updateStarRating with container:', starContainer);
      updateStarRating(starContainer, averageRating);
  } else {
      console.warn('No star container found');
  }
  
  ratingComponent.style.display = 'flex';
  performanceMetrics.domOperations++;
  console.log('Rating display update complete');
}

// =================================================================================
// Optimized Star Rating System
// =================================================================================

function updateStarRating(container, rating) {
  console.log('updateStarRating called with rating:', rating, 'container:', container);
  
  // Handle both svg path and direct path elements
  let starPaths = container.querySelectorAll('svg path');
  
  // If no svg paths found, look for direct path elements
  if (starPaths.length === 0) {
      starPaths = container.querySelectorAll('path');
  }
  
  console.log('Found starPaths:', starPaths.length);
  
  if (starPaths.length === 0) {
      console.warn('No star paths found in container:', container);
      return;
  }
  
  // Ensure paths are wrapped in SVG if they aren't already
  const firstPath = starPaths[0];
  const parentElement = firstPath.parentElement;
  
  console.log('Parent element tag:', parentElement.tagName);
  
  // If paths are not in an SVG, wrap them
  if (parentElement.tagName !== 'SVG') {
      console.log('Wrapping paths in SVG element');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 1000 1000');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.style.display = 'inline-block';
      svg.style.verticalAlign = 'middle';
      
      // Move all paths to the SVG
      while (container.firstChild) {
          svg.appendChild(container.firstChild);
      }
      container.appendChild(svg);
      
      // Update starPaths reference
      starPaths = svg.querySelectorAll('path');
      console.log('Updated starPaths count:', starPaths.length);
  }
  
  // Use document fragment to minimize reflows
  const fragment = document.createDocumentFragment();
  
  starPaths.forEach((path, index) => {
      const clone = path.cloneNode(true);
      const fillColor = index < rating ? 'gold' : 'none';
      clone.setAttribute('fill', fillColor);
      clone.setAttribute('stroke', 'black');
      console.log(`Star ${index + 1}: fill=${fillColor}, rating=${rating}`);
      fragment.appendChild(clone);
  });
  
  // Single DOM operation to replace all stars
  const svgElement = container.querySelector('svg') || container;
  svgElement.innerHTML = '';
  starPaths.forEach((_, index) => {
      svgElement.appendChild(fragment.children[index].cloneNode(true));
  });
  
  console.log('Star rating update complete');
}

// =================================================================================
// Enhanced Product Page Reviews with Virtual Scrolling
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
      
      // Use virtual scrolling for large review lists
      if (productReviews.length > CONFIG.VIRTUAL_SCROLL_THRESHOLD) {
          setupVirtualScrolling(productReviews);
      } else {
          applyAndRenderReviews(productReviews);
      }
  }
}

// =================================================================================
// Virtual Scrolling Implementation
// =================================================================================

function setupVirtualScrolling(reviews) {
  const container = document.getElementById('reviews-container');
  if (!container) return;

  const state = reviewDataStore.virtualScrollState;
  state.containerHeight = container.offsetHeight || 600;
  
  // Create virtual container
  const virtualContainer = document.createElement('div');
  virtualContainer.style.height = `${reviews.length * state.itemHeight}px`;
  virtualContainer.style.position = 'relative';
  
  const viewport = document.createElement('div');
  viewport.style.height = `${state.containerHeight}px`;
  viewport.style.overflow = 'auto';
  viewport.style.position = 'relative';
  
  container.innerHTML = '';
  container.appendChild(viewport);
  viewport.appendChild(virtualContainer);
  
  // Setup scroll listener
  const debouncedScroll = debounce(() => updateVirtualView(reviews, viewport, virtualContainer), 16);
  viewport.addEventListener('scroll', debouncedScroll);
  
  // Initial render
  updateVirtualView(reviews, viewport, virtualContainer);
}

function updateVirtualView(reviews, viewport, container) {
  const state = reviewDataStore.virtualScrollState;
  const scrollTop = viewport.scrollTop;
  
  const startIndex = Math.floor(scrollTop / state.itemHeight);
  const endIndex = Math.min(
      startIndex + Math.ceil(state.containerHeight / state.itemHeight) + 1,
      reviews.length
  );
  
  // Clear previous cards
  cardPool.releaseAll();
  container.innerHTML = '';
  
  // Render visible items
  for (let i = startIndex; i < endIndex; i++) {
      const review = reviews[i];
      const card = createOptimizedReviewCard(review);
      
      if (card) {
          card.style.transform = `translateY(${i * state.itemHeight}px)`;
          card.style.visibility = 'visible';
          container.appendChild(card);
      }
  }
}

function createOptimizedReviewCard(review) {
  const card = cardPool.getCard();
  if (!card) return null;
  
  // Use efficient DOM updates
  const updates = [
      { selector: '[reviewcard="initial"]', content: review.Review_Name.charAt(0).toUpperCase() },
      { selector: '[reviewcard="name"]', content: review.Review_Name },
      { selector: '[reviewcard="title"]', content: review.Product },
      { selector: '[reviewcard="content"]', content: review.Review_Review },
      { selector: '[reviewcard="timestamp"]', content: formatTimeAgo(review.Review_DateTime) }
  ];
  
  updates.forEach(({ selector, content }) => {
      const element = card.querySelector(selector);
      if (element) element.textContent = content;
  });
  
  // Update star rating
  const starsContainer = card.querySelector('[reviewcard="starRating"]');
  if (starsContainer) {
      updateStarRating(starsContainer, review.Review_Rating);
  }
  
  return card;
}

// =================================================================================
// Enhanced Filter and Sort System
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
  
  // Use virtual scrolling for large lists
  if (processedReviews.length > CONFIG.VIRTUAL_SCROLL_THRESHOLD) {
      setupVirtualScrolling(processedReviews);
  } else {
      renderReviews(processedReviews);
  }
  
  performanceMetrics.renderTime = performance.now() - startTime;
}

// =================================================================================
// Enhanced Rendering Functions
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
// Memory Management and Cleanup
// =================================================================================

function cleanup() {
  // Clear observers
  lazyLoadObserver.disconnect();
  
  // Clear caches
  cacheManager.clear();
  
  // Release card pool
  cardPool.releaseAll();
  
  // Clear performance metrics
  Object.keys(performanceMetrics).forEach(key => {
      performanceMetrics[key] = 0;
  });
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);

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
// Error Handling and Fallbacks
// =================================================================================

function showErrorState() {
  const containers = document.querySelectorAll('#reviews-container, .review_ui-header, .review_ui-filter');
  containers.forEach(container => {
      if (container) {
          container.innerHTML = '<p>Unable to load reviews. Please try again later.</p>';
      }
  });
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
// Export for testing and debugging
// =================================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
      reviewDataStore,
      performanceMetrics,
      cacheManager,
      formatTimeAgo,
      debounce
  };
}

// =================================================================================
// Debug Functions
// =================================================================================

// Function to manually test star rating update
function testStarRating() {
  console.log('Testing star rating update...');
  const ratingComponent = document.querySelector('[review="productCard_rating"]');
  if (ratingComponent) {
      console.log('Found rating component:', ratingComponent);
      
      // Test finding paths directly
      const starContainer = ratingComponent.querySelector('[review="productCard_starRating"]');
      if (starContainer) {
          console.log('Found star container:', starContainer);
          const paths = starContainer.querySelectorAll('path');
          console.log('Found paths:', paths.length);
          paths.forEach((path, index) => {
              console.log(`Path ${index}:`, path.outerHTML.substring(0, 100) + '...');
          });
      }
      
      updateRatingDisplay(ratingComponent, 3, 5);
  } else {
      console.log('No rating component found');
  }
}

// Make test function available globally
window.testStarRating = testStarRating;

// Function to manually initialize the review system
function manualInit() {
  console.log('Manual initialization triggered');
  initializeReviewSystem();
}

// Make manual init available globally
window.manualInit = manualInit;

// Function to manually trigger rating update for a specific product
function testProductRating(productId) {
  console.log('Testing product rating for:', productId);
  const card = document.querySelector(`[data-id="${productId}"]`);
  if (card) {
      console.log('Found card for product:', productId);
      loadProductRating(card, productId);
  } else {
      console.log('No card found for product:', productId);
      // Try to find any card with data-id
      const allCards = document.querySelectorAll('[data-id]');
      console.log('All cards with data-id:', allCards.length);
      allCards.forEach(card => {
          console.log('Card:', card.tagName, card.getAttribute('data-id'));
      });
  }
}

// Make test product rating available globally
window.testProductRating = testProductRating;

// Function to check available reviews
function checkReviews() {
  console.log('Checking reviews in data store...');
  console.log('Total reviews loaded:', reviewDataStore.totalReviews);
  console.log('Products with reviews:', reviewDataStore.reviewsByProductId.size);
  
  // Show first few products
  let count = 0;
  for (const [productId, reviews] of reviewDataStore.reviewsByProductId) {
      if (count < 5) {
          console.log(`Product ${productId}: ${reviews.length} reviews`);
          const avgRating = reviews.reduce((acc, r) => acc + r.Review_Rating, 0) / reviews.length;
          console.log(`  Average rating: ${avgRating.toFixed(2)}`);
      }
      count++;
  }
}

// Make check reviews available globally
window.checkReviews = checkReviews;

// Function to force trigger intersection observer for all cards
function forceTriggerRatings() {
  console.log('Forcing rating trigger for all cards...');
  const allCards = document.querySelectorAll('[data-id]');
  console.log('Found cards:', allCards.length);
  
  allCards.forEach(card => {
      const productId = card.getAttribute('data-id');
      if (productId) {
          console.log('Forcing rating load for product:', productId);
          loadProductRating(card, productId);
      }
  });
}

// Make force trigger available globally
window.forceTriggerRatings = forceTriggerRatings;
