/* js/lenis.js - Lenis Inertial Smooth Scrolling Instantiator */

export function initSmoothScrolling() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        console.log("Reduced motion active. Bypassing Lenis.");
        return null;
    }

    if (typeof Lenis === 'undefined') {
        console.log("Lenis Smooth Scroll CDN not loaded. Disabling smooth scroll physics.");
        return null;
    }

    // Instantiate Lenis
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // standard inertial deceleration
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    // Animate loop
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Coordinate with GSAP ScrollTriggers if loaded
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', () => {
            ScrollTrigger.update();
        });
        
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        
        gsap.ticker.lagSmoothing(0);
    }

    console.log("LuxeHaven Lenis Smooth Scrolling Configured Successfully.");
    return lenis;
}
