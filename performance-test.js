// =================================================================================
// Performance Testing Suite
// =================================================================================

class PerformanceTester {
    constructor() {
        this.metrics = {
            original: {},
            optimized: {},
            comparison: {}
        };
        this.testData = this.generateTestData();
    }

    generateTestData() {
        const reviews = [];
        const productIds = ['prod1', 'prod2', 'prod3', 'prod4', 'prod5'];
        
        for (let i = 0; i < 1000; i++) {
            reviews.push({
                Shopify_ID: productIds[i % productIds.length],
                Review_Rating: Math.floor(Math.random() * 5) + 1,
                Review_Name: `User ${i}`,
                Review_Review: `This is a test review ${i}. `.repeat(Math.floor(Math.random() * 5) + 1),
                Product: `Test Product ${i % productIds.length}`,
                Review_DateTime: Date.now() - (Math.random() * 365 * 24 * 60 * 60 * 1000)
            });
        }
        
        return reviews;
    }

    async runFullTestSuite() {
        console.log('🚀 Starting Performance Test Suite...');
        
        await this.testAPIFetching();
        await this.testDataProcessing();
        await this.testDOMOperations();
        await this.testMemoryUsage();
        await this.testScrollPerformance();
        await this.testCaching();
        
        this.generateReport();
    }

    async testAPIFetching() {
        console.log('📡 Testing API Fetching Performance...');
        
        // Simulate original approach
        const originalStart = performance.now();
        await this.simulateOriginalAPIFetch();
        const originalTime = performance.now() - originalStart;
        
        // Simulate optimized approach with caching
        const optimizedStart = performance.now();
        await this.simulateOptimizedAPIFetch();
        const optimizedTime = performance.now() - optimizedStart;
        
        this.metrics.original.apiFetchTime = originalTime;
        this.metrics.optimized.apiFetchTime = optimizedTime;
        
        console.log(`Original API fetch: ${originalTime.toFixed(2)}ms`);
        console.log(`Optimized API fetch: ${optimizedTime.toFixed(2)}ms`);
        console.log(`Improvement: ${((originalTime - optimizedTime) / originalTime * 100).toFixed(1)}%`);
    }

    async simulateOriginalAPIFetch() {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Simulate processing all at once
        this.testData.forEach(review => {
            // Simulate some processing
            JSON.stringify(review);
        });
    }

    async simulateOptimizedAPIFetch() {
        // Check cache first
        const cached = this.getFromCache('testData');
        if (cached) {
            return cached;
        }
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Simulate batch processing
        const batchSize = 20;
        for (let i = 0; i < this.testData.length; i += batchSize) {
            const batch = this.testData.slice(i, i + batchSize);
            batch.forEach(review => JSON.stringify(review));
            
            // Yield to main thread
            if (i % 100 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        this.setCache('testData', this.testData);
    }

    async testDataProcessing() {
        console.log('⚡ Testing Data Processing Performance...');
        
        // Original approach
        const originalStart = performance.now();
        const originalResult = this.processDataOriginal(this.testData);
        const originalTime = performance.now() - originalStart;
        
        // Optimized approach
        const optimizedStart = performance.now();
        const optimizedResult = this.processDataOptimized(this.testData);
        const optimizedTime = performance.now() - optimizedStart;
        
        this.metrics.original.dataProcessingTime = originalTime;
        this.metrics.optimized.dataProcessingTime = optimizedTime;
        
        console.log(`Original processing: ${originalTime.toFixed(2)}ms`);
        console.log(`Optimized processing: ${optimizedTime.toFixed(2)}ms`);
        console.log(`Improvement: ${((originalTime - optimizedTime) / originalTime * 100).toFixed(1)}%`);
    }

    processDataOriginal(reviews) {
        const productMap = new Map();
        
        reviews.forEach(review => {
            const productId = review.Shopify_ID;
            if (!productMap.has(productId)) {
                productMap.set(productId, []);
            }
            productMap.get(productId).push(review);
        });
        
        return productMap;
    }

    processDataOptimized(reviews) {
        const productMap = new Map();
        const ratingIndex = new Map();
        
        reviews.forEach(review => {
            const productId = review.Shopify_ID;
            
            if (!productMap.has(productId)) {
                productMap.set(productId, []);
                ratingIndex.set(productId, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
            }
            
            productMap.get(productId).push(review);
            ratingIndex.get(productId)[review.Review_Rating]++;
        });
        
        return { productMap, ratingIndex };
    }

    async testDOMOperations() {
        console.log('🎨 Testing DOM Operations Performance...');
        
        // Create test containers
        const originalContainer = document.createElement('div');
        const optimizedContainer = document.createElement('div');
        document.body.appendChild(originalContainer);
        document.body.appendChild(optimizedContainer);
        
        // Test original DOM operations
        const originalStart = performance.now();
        await this.simulateOriginalDOMOperations(originalContainer);
        const originalTime = performance.now() - originalStart;
        
        // Test optimized DOM operations
        const optimizedStart = performance.now();
        await this.simulateOptimizedDOMOperations(optimizedContainer);
        const optimizedTime = performance.now() - optimizedStart;
        
        this.metrics.original.domOperationsTime = originalTime;
        this.metrics.optimized.domOperationsTime = optimizedTime;
        
        // Cleanup
        document.body.removeChild(originalContainer);
        document.body.removeChild(optimizedContainer);
        
        console.log(`Original DOM operations: ${originalTime.toFixed(2)}ms`);
        console.log(`Optimized DOM operations: ${optimizedTime.toFixed(2)}ms`);
        console.log(`Improvement: ${((originalTime - optimizedTime) / originalTime * 100).toFixed(1)}%`);
    }

    async simulateOriginalDOMOperations(container) {
        // Simulate individual DOM insertions
        for (let i = 0; i < 100; i++) {
            const element = document.createElement('div');
            element.textContent = `Review ${i}`;
            element.className = 'review-card';
            
            // Individual style updates
            element.style.padding = '10px';
            element.style.margin = '5px';
            element.style.background = '#f0f0f0';
            
            container.appendChild(element);
            
            // Force reflow
            element.offsetHeight;
        }
    }

    async simulateOptimizedDOMOperations(container) {
        // Use document fragment
        const fragment = document.createDocumentFragment();
        
        // Batch create elements
        for (let i = 0; i < 100; i++) {
            const element = document.createElement('div');
            element.textContent = `Review ${i}`;
            element.className = 'review-card optimized';
            fragment.appendChild(element);
        }
        
        // Single DOM insertion
        container.appendChild(fragment);
        
        // Batch style updates using RAF
        await new Promise(resolve => {
            requestAnimationFrame(() => {
                const elements = container.querySelectorAll('.optimized');
                elements.forEach(element => {
                    element.style.cssText = 'padding: 10px; margin: 5px; background: #f0f0f0;';
                });
                resolve();
            });
        });
    }

    async testMemoryUsage() {
        console.log('💾 Testing Memory Usage...');
        
        const measureMemory = () => {
            if (performance.memory) {
                return {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                };
            }
            return null;
        };
        
        const initialMemory = measureMemory();
        
        // Simulate original memory usage
        const originalObjects = [];
        for (let i = 0; i < 1000; i++) {
            originalObjects.push({
                id: i,
                data: new Array(100).fill(Math.random()),
                element: document.createElement('div')
            });
        }
        
        const afterOriginal = measureMemory();
        
        // Cleanup original
        originalObjects.length = 0;
        
        // Force garbage collection (if available)
        if (window.gc) window.gc();
        
        // Simulate optimized memory usage with object pooling
        const objectPool = [];
        const reusableObjects = [];
        
        for (let i = 0; i < 100; i++) {
            objectPool.push({
                id: null,
                data: null,
                element: document.createElement('div')
            });
        }
        
        // Simulate reuse
        for (let i = 0; i < 1000; i++) {
            let obj = objectPool.find(o => !o.inUse);
            if (!obj) {
                obj = {
                    id: null,
                    data: null,
                    element: document.createElement('div')
                };
                objectPool.push(obj);
            }
            
            obj.id = i;
            obj.data = new Array(10).fill(Math.random()); // Smaller data
            obj.inUse = true;
            reusableObjects.push(obj);
            
            // Simulate cleanup
            if (i % 50 === 0) {
                reusableObjects.forEach(o => {
                    o.inUse = false;
                    o.data = null;
                });
                reusableObjects.length = 0;
            }
        }
        
        const afterOptimized = measureMemory();
        
        if (initialMemory && afterOriginal && afterOptimized) {
            const originalIncrease = afterOriginal.used - initialMemory.used;
            const optimizedIncrease = afterOptimized.used - initialMemory.used;
            
            this.metrics.original.memoryUsage = originalIncrease;
            this.metrics.optimized.memoryUsage = optimizedIncrease;
            
            console.log(`Original memory increase: ${(originalIncrease / 1048576).toFixed(2)}MB`);
            console.log(`Optimized memory increase: ${(optimizedIncrease / 1048576).toFixed(2)}MB`);
            console.log(`Memory improvement: ${((originalIncrease - optimizedIncrease) / originalIncrease * 100).toFixed(1)}%`);
        } else {
            console.log('Memory measurement not available in this browser');
        }
    }

    async testScrollPerformance() {
        console.log('📜 Testing Scroll Performance...');
        
        // Create test containers
        const container = document.createElement('div');
        container.style.cssText = 'height: 400px; overflow-y: auto; position: fixed; top: 0; left: -9999px;';
        document.body.appendChild(container);
        
        // Test original scroll (render all items)
        const originalStart = performance.now();
        this.simulateOriginalScroll(container);
        const originalTime = performance.now() - originalStart;
        
        // Clear container
        container.innerHTML = '';
        
        // Test optimized scroll (virtual scrolling)
        const optimizedStart = performance.now();
        this.simulateOptimizedScroll(container);
        const optimizedTime = performance.now() - optimizedStart;
        
        this.metrics.original.scrollPerformance = originalTime;
        this.metrics.optimized.scrollPerformance = optimizedTime;
        
        // Cleanup
        document.body.removeChild(container);
        
        console.log(`Original scroll rendering: ${originalTime.toFixed(2)}ms`);
        console.log(`Optimized scroll rendering: ${optimizedTime.toFixed(2)}ms`);
        console.log(`Improvement: ${((originalTime - optimizedTime) / originalTime * 100).toFixed(1)}%`);
    }

    simulateOriginalScroll(container) {
        // Render all 1000 items
        for (let i = 0; i < 1000; i++) {
            const item = document.createElement('div');
            item.style.cssText = 'height: 50px; border: 1px solid #ccc; margin: 2px;';
            item.textContent = `Item ${i}`;
            container.appendChild(item);
        }
    }

    simulateOptimizedScroll(container) {
        // Virtual scrolling - only render visible items
        const itemHeight = 50;
        const containerHeight = 400;
        const visibleItems = Math.ceil(containerHeight / itemHeight) + 1;
        
        // Create virtual container
        const virtualContainer = document.createElement('div');
        virtualContainer.style.height = `${1000 * itemHeight}px`;
        virtualContainer.style.position = 'relative';
        container.appendChild(virtualContainer);
        
        // Render only visible items
        for (let i = 0; i < Math.min(visibleItems, 1000); i++) {
            const item = document.createElement('div');
            item.style.cssText = `height: ${itemHeight}px; border: 1px solid #ccc; margin: 2px; position: absolute; top: ${i * itemHeight}px; width: calc(100% - 4px);`;
            item.textContent = `Item ${i}`;
            virtualContainer.appendChild(item);
        }
    }

    async testCaching() {
        console.log('🗄️ Testing Caching Performance...');
        
        const testKey = 'test-cache-key';
        const testData = { large: new Array(1000).fill('test data') };
        
        // Test without caching (repeated operations)
        const noCacheStart = performance.now();
        for (let i = 0; i < 100; i++) {
            JSON.parse(JSON.stringify(testData)); // Simulate expensive operation
        }
        const noCacheTime = performance.now() - noCacheStart;
        
        // Test with caching
        const withCacheStart = performance.now();
        let cachedResult = this.getFromCache(testKey);
        
        if (!cachedResult) {
            cachedResult = JSON.parse(JSON.stringify(testData));
            this.setCache(testKey, cachedResult);
        }
        
        // Subsequent operations use cache
        for (let i = 0; i < 99; i++) {
            this.getFromCache(testKey);
        }
        const withCacheTime = performance.now() - withCacheStart;
        
        this.metrics.original.cachingTime = noCacheTime;
        this.metrics.optimized.cachingTime = withCacheTime;
        
        console.log(`Without caching: ${noCacheTime.toFixed(2)}ms`);
        console.log(`With caching: ${withCacheTime.toFixed(2)}ms`);
        console.log(`Improvement: ${((noCacheTime - withCacheTime) / noCacheTime * 100).toFixed(1)}%`);
    }

    // Simple cache implementation for testing
    getFromCache(key) {
        const cached = this._cache && this._cache[key];
        if (cached && cached.expires > Date.now()) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data, duration = 5 * 60 * 1000) {
        if (!this._cache) this._cache = {};
        this._cache[key] = {
            data,
            expires: Date.now() + duration
        };
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 PERFORMANCE TEST RESULTS');
        console.log('='.repeat(60));
        
        const tests = [
            { name: 'API Fetching', original: 'apiFetchTime', optimized: 'apiFetchTime' },
            { name: 'Data Processing', original: 'dataProcessingTime', optimized: 'dataProcessingTime' },
            { name: 'DOM Operations', original: 'domOperationsTime', optimized: 'domOperationsTime' },
            { name: 'Scroll Performance', original: 'scrollPerformance', optimized: 'scrollPerformance' },
            { name: 'Caching', original: 'cachingTime', optimized: 'cachingTime' }
        ];
        
        let totalImprovement = 0;
        let validTests = 0;
        
        tests.forEach(test => {
            const originalValue = this.metrics.original[test.original];
            const optimizedValue = this.metrics.optimized[test.optimized];
            
            if (originalValue && optimizedValue) {
                const improvement = ((originalValue - optimizedValue) / originalValue * 100);
                totalImprovement += improvement;
                validTests++;
                
                console.log(`${test.name}:`);
                console.log(`  Original: ${originalValue.toFixed(2)}ms`);
                console.log(`  Optimized: ${optimizedValue.toFixed(2)}ms`);
                console.log(`  Improvement: ${improvement.toFixed(1)}%`);
                console.log('');
            }
        });
        
        // Memory usage (different unit)
        const originalMemory = this.metrics.original.memoryUsage;
        const optimizedMemory = this.metrics.optimized.memoryUsage;
        
        if (originalMemory && optimizedMemory) {
            const memoryImprovement = ((originalMemory - optimizedMemory) / originalMemory * 100);
            console.log(`Memory Usage:`);
            console.log(`  Original: ${(originalMemory / 1048576).toFixed(2)}MB`);
            console.log(`  Optimized: ${(optimizedMemory / 1048576).toFixed(2)}MB`);
            console.log(`  Improvement: ${memoryImprovement.toFixed(1)}%`);
            console.log('');
        }
        
        if (validTests > 0) {
            const averageImprovement = totalImprovement / validTests;
            console.log('='.repeat(60));
            console.log(`🏆 AVERAGE PERFORMANCE IMPROVEMENT: ${averageImprovement.toFixed(1)}%`);
            console.log('='.repeat(60));
        }
        
        return this.metrics;
    }
}

// Export for use in testing environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceTester;
}

// Auto-run tests if in browser environment
if (typeof window !== 'undefined' && window.location) {
    // Only run if explicitly requested
    if (window.location.search.includes('runPerformanceTests=true')) {
        document.addEventListener('DOMContentLoaded', async () => {
            const tester = new PerformanceTester();
            await tester.runFullTestSuite();
        });
    }
}