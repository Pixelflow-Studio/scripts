
        document.addEventListener("DOMContentLoaded", () => {
            const searchWrapper = document.querySelector('[data-search="wrapper"]');
            const searchInputs = document.querySelectorAll('[data-search="input"]');
            const searchPanel = document.querySelector('[data-search="panel"]');
            const inputCloseButton = document.querySelector('[data-search="close"]');
            const body = document.body;

            if (!searchWrapper || searchInputs.length === 0 || !searchPanel || !inputCloseButton) {
                console.error("A required element for the search animation is missing.");
                return;
            }

            // SIMPLIFIED initial state for the close button
            gsap.set(inputCloseButton, { opacity: 0, visibility: 'hidden' });
            gsap.set(searchPanel, { yPercent: -100 });

            let mm = gsap.matchMedia();

            function setupEventListeners(timeline) {
                searchInputs.forEach(input => {
                    input.addEventListener("click", () => timeline.play());
                });
                inputCloseButton.addEventListener("click", () => timeline.reverse());
                document.addEventListener("click", (event) => {
                    if (timeline.progress() > 0 && !timeline.isActive() && !searchWrapper.contains(event.target) && !searchPanel.contains(event.target)) {
                        timeline.reverse();
                    }
                });
            }
            
            // DESKTOP SETUP
            mm.add("(min-width: 992px)", () => {
                const tl = gsap.timeline({ paused: true, onStart: () => { body.style.paddingRight = `${window.innerWidth - body.clientWidth}px`; body.classList.add("body-no-scroll"); }, onReverseComplete: () => { body.style.paddingRight = ''; body.classList.remove("body-no-scroll"); } });
                tl.to(searchPanel, { yPercent: 0, opacity: 1, visibility: "visible", duration: 0.6, ease: "power3.inOut" })
                  .to(searchWrapper, { width: "15rem", duration: 0.4, ease: "power2.out" }, 0)
                  // SIMPLIFIED animation for the close button
                  .to(inputCloseButton, { opacity: 1, visibility: 'visible', duration: 0.4 }, 0);
                setupEventListeners(tl);
            });

            // MOBILE SETUP
            mm.add("(max-width: 991px)", () => {
                const tl = gsap.timeline({ paused: true, onStart: () => { body.classList.add("body-no-scroll"); }, onReverseComplete: () => { body.classList.remove("body-no-scroll"); } });
                tl.to(searchPanel, { yPercent: 0, opacity: 1, visibility: "visible", duration: 0.5, ease: "power3.inOut" })
                  // SIMPLIFIED animation for the close button
                  .to(inputCloseButton, { opacity: 1, visibility: 'visible', duration: 0.4 }, 0);
                setupEventListeners(tl);
            });
        });
