// =================================================================================
// Global State & Data Store
// =================================================================================

const reviewDataStore = {
    reviewsByProductId: new Map(),
    isDataFetched: false
};

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
function debounce(func, delay = 250) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// =================================================================================
// Main Execution Block
// =================================================================================

document.addEventListener('smootify:loaded', initializeReviewSystem);

// =================================================================================
// Initialization and Data Fetching
// =================================================================================

async function initializeReviewSystem() {
    if (reviewDataStore.isDataFetched) return;
    const apiUrl = 'https://x8ki-letl-twmt.n7.xano.io/api:LDyz3cwj/ALL_product_reviews';

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API responded with status: ${response.status}`);
        const allReviews = await response.json();
        reviewDataStore.isDataFetched = true;

        allReviews.forEach(review => {
            const productId = review.Shopify_ID;
            if (!reviewDataStore.reviewsByProductId.has(productId)) {
                reviewDataStore.reviewsByProductId.set(productId, []);
            }
            reviewDataStore.reviewsByProductId.get(productId).push(review);
        });
        
        populateProductCardRatings();
        
        createProductGridObserver('smootify-search-discovery');
        createProductGridObserver('smootify-search');

        if (window.location.pathname.startsWith('/product/')) {
            setupProductPageReviews();
        }
    } catch (error) {
        console.error("An error occurred while fetching all reviews from Xano:", error);
    }
}

// =================================================================================
// Observer for Dynamic Content
// =================================================================================

// Create a single debounced version of our rating function to be shared by all observers.
const debouncedPopulateRatings = debounce(populateProductCardRatings);

function createProductGridObserver(selector) {
    const targetNode = document.querySelector(selector);
    if (!targetNode) return;

    const config = { childList: true, subtree: true };

    // The observer's callback now calls the debounced function, preventing crashes.
    const observer = new MutationObserver(debouncedPopulateRatings);
    
    observer.observe(targetNode, config);
}

// =================================================================================
// Logic for Product Card Ratings
// =================================================================================

function populateProductCardRatings() {
    const productCards = document.querySelectorAll('smootify-product[data-id], .sm-product[data-id]');
    productCards.forEach(card => {
        const productId = card.getAttribute('data-id');
        const reviews = reviewDataStore.reviewsByProductId.get(productId) || [];
        const ratingComponent = card.querySelector('[review="productCard_rating"]');
        
        if (!ratingComponent) return;

        const totalReviews = reviews.length;
        let averageRating = 0;
        if (totalReviews > 0) {
            averageRating = Math.round(reviews.reduce((acc, r) => acc + r.Review_Rating, 0) / totalReviews);
        }

        const starContainer = ratingComponent.querySelector('[review="productCard_starRating"]');
        const totalElement = ratingComponent.querySelector('[review="productCard_reviewTotal"]');

        if (totalElement) totalElement.textContent = totalReviews;
        
        if (starContainer) {
            // Debug: Check container visibility and size
            console.log('Star container before update:', {
                offsetWidth: starContainer.offsetWidth,
                offsetHeight: starContainer.offsetHeight,
                clientWidth: starContainer.clientWidth,
                clientHeight: starContainer.clientHeight,
                style: starContainer.style.cssText,
                computedStyle: window.getComputedStyle(starContainer)
            });

            // Force the container to be visible and have dimensions
            starContainer.style.visibility = 'visible';
            starContainer.style.display = 'flex';
            starContainer.style.width = 'auto';
            starContainer.style.height = 'auto';
            starContainer.style.minWidth = '100px';
            starContainer.style.minHeight = '20px';

            const starSvgPaths = starContainer.querySelectorAll('svg path');
            console.log('Found SVG paths:', starSvgPaths.length);
            
            starSvgPaths.forEach((path, index) => {
                path.setAttribute('fill', index < averageRating ? 'gold' : 'none');
                path.setAttribute('stroke', 'black');
                console.log(`Star ${index + 1}: fill="${index < averageRating ? 'gold' : 'none'}"`);
            });

            // Debug: Check container after update
            console.log('Star container after update:', {
                offsetWidth: starContainer.offsetWidth,
                offsetHeight: starContainer.offsetHeight,
                clientWidth: starContainer.clientWidth,
                clientHeight: starContainer.clientHeight,
                style: starContainer.style.cssText
            });
        }
        
        ratingComponent.style.display = 'flex';
        ratingComponent.style.visibility = 'visible';
    });
}

// =================================================================================
// Logic for the Detailed Product Page Review Section
// =================================================================================

function setupProductPageReviews() {
    const mainProductElement = document.querySelector('main smootify-product[data-id]:not([data-parent-id])');
    
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
    const headerEl = document.querySelector('.review_ui-header');
    const filterEl = document.querySelector('.review_ui-filter');
    const emptyStateEl = document.querySelector('.review-empty');
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
    if (totalReviews > 0) averageRating = Math.round(reviews.reduce((acc, r) => acc + r.Review_Rating, 0) / totalReviews);
    totalReviewsElement.textContent = totalReviews;
    const starSvgPaths = starContainer.querySelectorAll('svg path');
    starSvgPaths.forEach((path, index) => {
        path.setAttribute('fill', index < averageRating ? 'gold' : 'none');
        path.setAttribute('stroke', 'black');
    });
}

function renderAverageRatingHeader(reviews) {
    const averageRatingEl = document.querySelector('[reviewui="averageRating"]');
    const starRatingEl = document.querySelector('[reviewui="starRating"]');
    const totalRatingsEl = document.querySelector('[reviewui="ratingsTotal"]');
    const reviewUiHeaderEl = document.querySelector('.review_ui-header');
    if (!averageRatingEl || !starRatingEl || !totalRatingsEl || !reviewUiHeaderEl) return;
    const totalReviews = reviews.length;
    let preciseAverage = 0;
    if (totalReviews > 0) preciseAverage = reviews.reduce((acc, r) => acc + r.Review_Rating, 0) / totalReviews;
    averageRatingEl.textContent = preciseAverage.toFixed(2);
    totalRatingsEl.textContent = totalReviews;
    const roundedAverage = Math.round(preciseAverage);
    const starSvgPaths = starRatingEl.querySelectorAll('svg path');
    starSvgPaths.forEach((path, index) => {
        path.setAttribute('fill', index < roundedAverage ? 'gold' : 'none');
        path.setAttribute('stroke', 'black');
    });
    reviewUiHeaderEl.style.opacity = '1';
}

function renderReviews(reviews) {
    const container = document.getElementById('reviews-container');
    const templateNode = document.getElementById('review-card-template');
    if (!container || !templateNode) return;
    container.innerHTML = '';
    if (!reviews || reviews.length === 0) {
        if (currentSortAndFilter.filterRating !== null) {
            container.innerHTML = `<p>No reviews match the selected filter.</p>`;
        }
        return;
    }
    reviews.forEach(review => {
        const cardClone = templateNode.firstElementChild.cloneNode(true);
        const initialEl = cardClone.querySelector('[reviewcard="initial"]');
        const nameEl = cardClone.querySelector('[reviewcard="name"]');
        const starsContainerEl = cardClone.querySelector('[reviewcard="starRating"]');
        const titleEl = cardClone.querySelector('[reviewcard="title"]');
        const contentEl = cardClone.querySelector('[reviewcard="content"]');
        const timestampEl = cardClone.querySelector('[reviewcard="timestamp"]');
        if (initialEl) initialEl.textContent = review.Review_Name.charAt(0).toUpperCase();
        if (nameEl) nameEl.textContent = review.Review_Name;
        if (titleEl) titleEl.textContent = review.Product;
        if (contentEl) contentEl.textContent = review.Review_Review;
        if (timestampEl) timestampEl.textContent = formatTimeAgo(review.Review_DateTime);
        if (starsContainerEl) {
            const starPaths = starsContainerEl.querySelectorAll('svg path');
            const rating = review.Review_Rating;
            starPaths.forEach((path, index) => {
                path.setAttribute('fill', index < rating ? 'gold' : 'none');
                path.setAttribute('stroke', 'black');
            });
        }
        cardClone.style.visibility = 'hidden';
        container.appendChild(cardClone);
    });
    gsap.fromTo("#reviews-container .review_card", { y: 30, opacity: 0 }, {
        duration: 0.6, y: 0, opacity: 1, visibility: 'visible',
        stagger: 0.1, ease: "power3.out"
    });
}

function formatTimeAgo(timestamp) {
    if (!timestamp) return '';
    const now = new Date();
    const reviewDate = new Date(timestamp);
    const secondsPast = (now.getTime() - reviewDate.getTime()) / 1000;
    if (secondsPast < 60) return 'Just now';
    if (secondsPast < 3600) return `${Math.round(secondsPast / 60)} minutes ago`;
    if (secondsPast < 86400) return `${Math.round(secondsPast / 3600)} hours ago`;
    if (secondsPast < 2592000) return `${Math.round(secondsPast / 86400)} days ago`;
    if (secondsPast < 31536000) {
        const months = Math.round(secondsPast / 2592000);
        return months <= 1 ? '1 month ago' : `${months} months ago`;
    }
    const years = Math.round(secondsPast / 31536000);
    return years <= 1 ? '1 year ago' : `${years} years ago`;
}

// =================================================================================
// Debugging Functions
// =================================================================================

// Function to check and fix star container visibility
window.checkStarVisibility = function() {
    console.log('=== CHECKING STAR CONTAINER VISIBILITY ===');
    
    const starContainers = document.querySelectorAll('[review="productCard_starRating"]');
    console.log('Found star containers:', starContainers.length);
    
    starContainers.forEach((container, index) => {
        console.log(`\n--- Container ${index + 1} ---`);
        console.log('Container element:', container);
        console.log('Container HTML:', container.innerHTML);
        
        const computedStyle = window.getComputedStyle(container);
        console.log('Computed styles:', {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            width: computedStyle.width,
            height: computedStyle.height,
            position: computedStyle.position,
            zIndex: computedStyle.zIndex
        });
        
        console.log('Dimensions:', {
            offsetWidth: container.offsetWidth,
            offsetHeight: container.offsetHeight,
            clientWidth: container.clientWidth,
            clientHeight: container.clientHeight,
            scrollWidth: container.scrollWidth,
            scrollHeight: container.scrollHeight
        });
        
        // Check if container has any content
        const paths = container.querySelectorAll('path');
        console.log('Path elements found:', paths.length);
        
        if (paths.length > 0) {
            console.log('First path element:', paths[0]);
            console.log('First path attributes:', {
                fill: paths[0].getAttribute('fill'),
                stroke: paths[0].getAttribute('stroke'),
                strokeWidth: paths[0].getAttribute('stroke-width')
            });
        }
    });
};

// Function to force fix all star containers
window.fixStarVisibility = function() {
    console.log('=== FIXING STAR CONTAINER VISIBILITY ===');
    
    const starContainers = document.querySelectorAll('[review="productCard_starRating"]');
    console.log('Fixing', starContainers.length, 'star containers');
    
    starContainers.forEach((container, index) => {
        console.log(`Fixing container ${index + 1}`);
        
        // Force visibility
        container.style.visibility = 'visible';
        container.style.display = 'flex';
        container.style.width = 'auto';
        container.style.height = 'auto';
        container.style.minWidth = '100px';
        container.style.minHeight = '20px';
        container.style.opacity = '1';
        container.style.position = 'relative';
        container.style.zIndex = '1';
        
        // Also fix parent rating component
        const ratingComponent = container.closest('[review="productCard_rating"]');
        if (ratingComponent) {
            ratingComponent.style.visibility = 'visible';
            ratingComponent.style.display = 'flex';
            ratingComponent.style.opacity = '1';
        }
        
        console.log(`Container ${index + 1} fixed. New dimensions:`, {
            offsetWidth: container.offsetWidth,
            offsetHeight: container.offsetHeight
        });
    });
    
    console.log('All star containers should now be visible!');
};

// Function to test star rendering
window.testStarRendering = function() {
    console.log('=== TESTING STAR RENDERING ===');
    
    const starContainers = document.querySelectorAll('[review="productCard_starRating"]');
    console.log('Found star containers:', starContainers.length);
    
    starContainers.forEach((container, index) => {
        console.log(`\nTesting container ${index + 1}`);
        
        // Force visibility first
        container.style.visibility = 'visible';
        container.style.display = 'flex';
        container.style.minWidth = '100px';
        container.style.minHeight = '20px';
        
        const paths = container.querySelectorAll('path');
        console.log('Found paths:', paths.length);
        
        // Test with different ratings
        [1, 2, 3, 4, 5].forEach(rating => {
            console.log(`Testing rating: ${rating}`);
            paths.forEach((path, pathIndex) => {
                const fill = pathIndex < rating ? 'gold' : 'none';
                path.setAttribute('fill', fill);
                path.setAttribute('stroke', 'black');
                console.log(`  Path ${pathIndex + 1}: fill="${fill}"`);
            });
            
            // Check dimensions after update
            console.log('Container dimensions:', {
                offsetWidth: container.offsetWidth,
                offsetHeight: container.offsetHeight
            });
        });
    });
};
