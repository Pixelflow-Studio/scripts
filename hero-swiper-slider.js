/**
 * ==================================================================================
 * HERO SLIDER - SWIPER & GSAP INTEGRATION
 * ==================================================================================
 * This script initializes a Swiper.js slider and uses GSAP to create custom
 * animations on the active slide. It is fully responsive.
 *
 * RESPONSIVE LOGIC:
 * To create a specific set of rules for "991px and below", we do the following:
 * 1. The BASE settings are the settings for mobile/tablet (991px and smaller).
 * 2. The BREAKPOINT at '992' introduces the settings for desktop (992px and larger).
 * ==================================================================================
 */

// --- 1. GSAP ANIMATION FUNCTIONS (No changes needed) ---
function animateSlideIn(slide) {
  const image = slide.querySelector('.hero-slide-img');
  const contentItems = slide.querySelectorAll('.gsap-stagger-item');
  if (!image || contentItems.length === 0) return;
  if (slide.classList.contains('swiper-slide-active')) {
    gsap.to(image, { scale: 1, duration: 1.5, ease: 'power1.inOut' });
    gsap.fromTo(contentItems, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power2.out' });
  }
}
function resetSlide(slide) {
  const image = slide.querySelector('.hero-slide-img');
  const contentItems = slide.querySelectorAll('.gsap-stagger-item');
  if (!image || contentItems.length === 0) return;
  gsap.to(image, { scale: 1.15, duration: 1, ease: 'power2.inOut' });
  gsap.to(contentItems, { opacity: 0, y: 20, duration: 0.3 });
}


// --- 2. SWIPER INITIALIZATION ---

const paginationEl = document.querySelector('.swiper-pagination');

const swiper = new Swiper('.hero-slider .swiper', {
  // --- BASE SETTINGS (APPLY TO SCREENS 991px AND SMALLER) ---
  // These settings will be active from 0px up to 991px wide.
  slidesPerView: 1,
  centeredSlides: false,
  spaceBetween: 0,

  // --- Core Behavior (Inherited by all sizes) ---
  loop: true,
  speed: 800,
  
  // --- Breakpoints Configuration ---
  breakpoints: {
    // --- SETTINGS FOR DESKTOP (992px AND WIDER) ---
    // When the window width is >= 992px, these settings will override the base settings.
    992: {
      slidesPerView: 'auto',
      centeredSlides: true,
      spaceBetween: 20,
    }
  },

  autoplay: {
    delay: 5000,
    disableOnInteraction: false,
    pauseOnMouseEnter: false,
  },
  
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  
  // --- Event Listeners for GSAP Integration (No changes needed) ---
  on: {
    init: function (swiper) {
      swiper.slides.forEach((slide, index) => {
        if (index === swiper.activeIndex) { animateSlideIn(slide); } 
        else { resetSlide(slide); }
      });
    },
    
    slideChangeTransitionStart: function (swiper) {
      swiper.slides.forEach(slide => {
          if (!slide.classList.contains('swiper-slide-active')) { resetSlide(slide); }
      });
    },

    slideChangeTransitionEnd: function (swiper) {
      animateSlideIn(swiper.slides[swiper.activeIndex]);
    },
      
    autoplayTimeLeft(s, time, progress) {
      paginationEl.style.setProperty('--progress', (1 - progress) * 100 + '%');
    },
  }
});
