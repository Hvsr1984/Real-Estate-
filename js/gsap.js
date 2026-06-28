/* js/gsap.js - GSAP ScrollTrigger & Choreographed Entries */

export function initGsapAnimations() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (typeof gsap === 'undefined') {
        console.log("GSAP CDN not loaded. Skipping custom entries.");
        return;
    }

    // Register ScrollTrigger plugin if available
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // 1. Fullscreen Hero Title overlapping parallax
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && typeof ScrollTrigger !== 'undefined') {
        gsap.to(heroTitle, {
            y: 120,
            opacity: 0.3,
            scrollTrigger: {
                trigger: '.hero-section',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            }
        });
    }

    // 2. Parallax background elements
    const parallaxContainers = document.querySelectorAll('.parallax-container');
    parallaxContainers.forEach(container => {
        const img = container.querySelector('img');
        if (img && typeof ScrollTrigger !== 'undefined') {
            gsap.fromTo(img, {
                yPercent: -15
            }, {
                yPercent: 15,
                ease: 'none',
                scrollTrigger: {
                    trigger: container,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true
                }
            });
        }
    });

    // 3. Staggered reveal for grid cards
    const grids = document.querySelectorAll('.property-grid');
    grids.forEach(grid => {
        const cards = grid.querySelectorAll('.property-card');
        if (cards.length > 0 && typeof ScrollTrigger !== 'undefined') {
            gsap.fromTo(cards, {
                y: 50,
                opacity: 0
            }, {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: grid,
                    start: 'top 85%'
                }
            });
        }
    });

    // 4. Split-Type slide reveals (simulated for headers)
    const headings = document.querySelectorAll('.section-title');
    headings.forEach(title => {
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.fromTo(title, {
                y: 30,
                opacity: 0
            }, {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: title,
                    start: 'top 90%'
                }
            });
        }
    });

    // 5. Entrance choreography for Homepage Hero V4
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        // Set initial states for clean fade/slide entries
        gsap.set('.hero-title', { opacity: 0, y: 50 });
        gsap.set('.editorial-label', { opacity: 0, x: -20 });
        gsap.set('.hero-desc', { opacity: 0, y: 15 });
        gsap.set('.hero-cta-btn', { opacity: 0, y: 15 });
        gsap.set('.hero-spec-item', { opacity: 0, y: 20 });
        gsap.set('.blueprint-canvas-wrapper', { opacity: 0, scale: 0.95 });
        gsap.set('.thumb-circle', { opacity: 0, scale: 0.8 });

        // Create staggered timeline on page load (triggered slightly after preloader)
        const tl = gsap.timeline({ delay: 1.0 });
        tl.to('.hero-title', { opacity: 1, y: 0, duration: 1.1, ease: 'power4.out' })
          .to('.editorial-label', { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out' }, '-=0.6')
          .to('.hero-desc', { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.4')
          .to('.hero-cta-btn', { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)' }, '-=0.3')
          .to('.hero-spec-item', { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' }, '-=0.4')
          .to('.blueprint-canvas-wrapper', { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }, '-=0.5')
          .to('.thumb-circle', { opacity: 1, scale: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(1.5)' }, '-=0.4');
    }

    console.log("LuxeHaven GSAP Timeline Choreography initialized.");
}
