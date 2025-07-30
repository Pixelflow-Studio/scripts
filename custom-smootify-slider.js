
 // ===================================================================
  // CUSTOM SMOOTIFY WEBFLOW SLIDER - PERFORMANCE OPTIMIZED
  // ===================================================================
document.addEventListener("smootify:product_loaded", (event) => {
  console.log(
    "Smootify loaded. Initializing optimized script with INDEX-BASED slider sync."
  );

  // 1. SELECT ALL ELEMENTS (cached for performance)
  const slider = document.querySelector(".media-gallery_thumbnails");
  const productWrapper = document.querySelector("smootify-product");
  const webflowSlider = document.querySelector(".media-slider.w-slider");

  if (!slider || !productWrapper || !webflowSlider) {
    console.error("Script error: A required element was not found.");
    return;
  }

  // 2. CACHE DOM ELEMENTS (performance optimization)
  let allThumbnails = null;
  let allDots = null;
  let lastActiveIndex = -1;
  let scrollTimeout = null;

  // 3. SCROLL ACTIVE THUMBNAIL INTO VIEW
  function scrollActiveThumbnailIntoView() {
    const activeThumbnail = slider.querySelector(
      ".media-gallery_thumbnail-image.active"
    );
    if (activeThumbnail) {
      activeThumbnail.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }

  // 4. SIMPLE THUMBNAIL SYNC
  function syncThumbnailsToSlider() {
    // Get all slider dots and thumbnails
    const allDots = Array.from(webflowSlider.querySelectorAll(".w-slider-dot"));
    const allThumbnails = slider.querySelectorAll(".media-gallery_thumbnail-image");

    // Find active dot index
    const activeIndex = allDots.findIndex((dot) =>
      dot.classList.contains("w-active")
    );

    if (activeIndex !== -1) {
      const targetThumbnail = allThumbnails[activeIndex];
      
      if (targetThumbnail) {
        // Remove active from all thumbnails
        allThumbnails.forEach((thumb) => {
          thumb.classList.remove("active");
        });
        
        // Add active to target thumbnail
        targetThumbnail.classList.add("active");
        
        // Scroll it into view
        scrollActiveThumbnailIntoView();
      }
    }
  }

  // 5. MUTATION OBSERVER TO WATCH FOR SLIDER CHANGES
  const sliderObserver = new MutationObserver(() => {
    syncThumbnailsToSlider();
  });
  sliderObserver.observe(webflowSlider, {
    attributes: true,
    attributeFilter: ["class"],
    subtree: true,
  });

  // 6. VARIANT CHANGE HANDLER
  productWrapper.addEventListener("changeVariant", (event) => {
    const variant = event.detail;
    console.log("Variant changed:", variant);
    
    // Wait a bit for DOM to update, then sync thumbnails
    setTimeout(() => {
      syncThumbnailsToSlider();
    }, 100);
  });



  // 7. OPTIMIZED DESKTOP SCRUBBING (throttled mouse events)
  let isDown = false;
  let startY, scrollTop;
  let mouseMoveThrottle = null;

  function onMouseDown(e) {
    isDown = true;
    slider.classList.add("active-scrub");
    startY = e.pageY - slider.offsetTop;
    scrollTop = slider.scrollTop;
    
    // Use passive listeners for better performance
    window.addEventListener("mousemove", onMouseMove, { passive: false });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
  }

  function onMouseMove(e) {
    if (!isDown) return;
    
    // Throttle mouse move for better performance
    if (mouseMoveThrottle) return;
    
    mouseMoveThrottle = requestAnimationFrame(() => {
      e.preventDefault();
      const y = e.pageY - slider.offsetTop;
      const walkY = (y - startY) * 2;
      slider.scrollTop = scrollTop - walkY;
      mouseMoveThrottle = null;
    });
  }

  function onMouseUp() {
    isDown = false;
    slider.classList.remove("active-scrub");
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    
    if (mouseMoveThrottle) {
      cancelAnimationFrame(mouseMoveThrottle);
      mouseMoveThrottle = null;
    }
  }

  // 8. OPTIMIZED INITIALIZATION
  const images = slider.querySelectorAll("img");
  images.forEach((img) => (img.draggable = false));
  slider.addEventListener("dragstart", (e) => e.preventDefault());

  // Throttled resize handler
  let resizeTimeout = null;
  function setupDesktopScrubbing() {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(() => {
      if (window.innerWidth > 991) {
        slider.addEventListener("mousedown", onMouseDown);
      } else {
        slider.removeEventListener("mousedown", onMouseDown);
      }
    }, 100);
  }

  setupDesktopScrubbing();
  window.addEventListener("resize", setupDesktopScrubbing, { passive: true });

  // Initial sync
  scrollActiveThumbnailIntoView();
});
