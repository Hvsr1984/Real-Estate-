/* js/cursor.js - Custom Cursor & Magnetic Interactions */

export function initCustomCursor() {
    // Disable custom cursor on touchscreens / mobile devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const cursor = document.querySelector('.custom-cursor');
    const trail = document.querySelector('.custom-cursor-trail');
    
    if (isTouchDevice) {
        if (cursor) cursor.style.display = 'none';
        if (trail) trail.style.display = 'none';
        return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    if (!cursor || !trail) return;

    let mouseX = 0;
    let mouseY = 0;
    let trailX = 0;
    let trailY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Move primary dot instantly
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    });

    // Trail physics (lag animation loop)
    function tick() {
        const dx = mouseX - trailX;
        const dy = mouseY - trailY;
        
        // Interpolate trail position
        trailX += dx * 0.15;
        trailY += dy * 0.15;
        
        trail.style.left = trailX + 'px';
        trail.style.top = trailY + 'px';
        
        requestAnimationFrame(tick);
    }
    tick();

    // Hover Scaling states
    const hoverables = 'a, button, select, input, .thumb-circle, .slider-arrow-btn, .card-wishlist-btn, .compare-slot-remove, .chat-choice-btn';
    
    function addHoverListeners() {
        document.querySelectorAll(hoverables).forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('hovering');
                trail.classList.add('hovering');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('hovering');
                trail.classList.remove('hovering');
            });
        });
    }
    
    addHoverListeners();
    
    // Watch for dynamic DOM modifications (e.g. search listings)
    const observer = new MutationObserver(() => {
        addHoverListeners();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Magnetic Button Effect
    const magneticElements = document.querySelectorAll('.magnetic');
    
    magneticElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            // Translate the element toward the cursor slightly
            el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
            trail.style.transform = `translate(-50%, -50%) scale(1.3)`;
        });
        
        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
            trail.style.transform = `translate(-50%, -50%) scale(1)`;
        });
    });
}
