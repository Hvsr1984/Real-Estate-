/* js/slider.js - Hero Slider Coordinator & CAD Blueprint Drawer */

import { showToast, updateWishlistUI } from './app.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Testimonials Swiper
    initTestimonialsSwiper();

    // Initialize Hero Slider & Blueprint
    initHeroSlider();
});

/* ==========================================================================
   1. TESTIMONIALS SLIDER
   ========================================================================== */
function initTestimonialsSwiper() {
    const swiperEl = document.querySelector('.testimonial-swiper');
    if (!swiperEl) return;

    new Swiper('.testimonial-swiper', {
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        effect: 'fade',
        fadeEffect: {
            crossFade: true
        },
        speed: 800
    });
}

/* ==========================================================================
   2. HERO SLIDER & BLUEPRINT DRAWING
   ========================================================================== */
let activeBlueprintReqId = null;

function initHeroSlider() {
    const canvas = document.getElementById('hero-blueprint');
    const titleEl = document.querySelector('.hero-title');
    const descEl = document.querySelector('.hero-desc');
    const detailLink = document.querySelector('.hero-desc-container a');
    const heroVideo = document.querySelector('.hero-video');
    
    const specCompletion = document.getElementById('hero-spec-completion');
    const specPlot = document.getElementById('hero-spec-plot');
    const specArea = document.getElementById('hero-spec-area');
    
    const prevBtn = document.getElementById('hero-prev-btn');
    const nextBtn = document.getElementById('hero-next-btn');
    const thumbsContainer = document.getElementById('hero-thumbs-container');
    const featuredContainer = document.getElementById('featured-properties-container');

    if (!prevBtn || !nextBtn) return;

    let properties = [];
    let currentIndex = 0;

    // Fetch listings
    fetch('../data/properties.json')
        .then(res => res.json())
        .then(data => {
            properties = data;
            
            // Render featured masterpieces on home grid
            renderFeatured(properties);
            
            // Set up Hero
            setupHero(currentIndex);
            renderThumbs();

            // Set up search box click listeners
            initSearchSubmit(properties);
        });

    function setupHero(index) {
        if (properties.length === 0) return;
        const prop = properties[index];

        // Fade elements
        gsap.to([titleEl, descEl, specCompletion, specPlot, specArea], {
            opacity: 0,
            y: -10,
            duration: 0.3,
            onComplete: () => {
                // Update elements
                titleEl.innerHTML = prop.title.toUpperCase().replace(' ', '<br>');
                descEl.textContent = prop.description;
                detailLink.setAttribute('href', `property.html?id=${prop.id}`);
                
                specCompletion.textContent = prop.completion;
                specPlot.textContent = prop.plotSize > 0 ? `${prop.plotSize} HA` : 'N/A';
                specArea.textContent = `${prop.area} M²`;

                if (heroVideo && prop.videoUrl) {
                    heroVideo.src = prop.videoUrl;
                    heroVideo.play().catch(() => {});
                }

                // Animate elements back
                gsap.to([titleEl, descEl, specCompletion, specPlot, specArea], {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.05
                });
                
                // Draw blueprint with animation
                animateBlueprintDraw(canvas);
            }
        });
    }

    function renderThumbs() {
        if (!thumbsContainer) return;
        thumbsContainer.innerHTML = '';
        
        properties.slice(0, 3).forEach((prop, idx) => {
            const circle = document.createElement('div');
            circle.className = 'thumb-circle';
            circle.innerHTML = `<img src="${prop.images[0]}" alt="${prop.title}">`;
            circle.addEventListener('click', () => {
                currentIndex = idx;
                setupHero(currentIndex);
            });
            thumbsContainer.appendChild(circle);
        });
    }

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + properties.length) % properties.length;
        setupHero(currentIndex);
    });

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % properties.length;
        setupHero(currentIndex);
    });
}

/* ==========================================================================
   BLUEPRINT CANVAS ANIMATOR
   ========================================================================== */
function animateBlueprintDraw(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Cancel previous drawing frame loop if running
    if (activeBlueprintReqId) {
        cancelAnimationFrame(activeBlueprintReqId);
    }

    // Set dimensions
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    // Blueprint blueprint lines
    const paths = [
        // Outer box walls
        { type: 'line', x1: 20, y1: 20, x2: width - 20, y2: 20 },
        { type: 'line', x1: width - 20, y1: 20, x2: width - 20, y2: height - 20 },
        { type: 'line', x1: width - 20, y1: height - 20, x2: 20, y2: height - 20 },
        { type: 'line', x1: 20, y1: height - 20, x2: 20, y2: 20 },
        
        // Inner room walls
        { type: 'line', x1: width * 0.4, y1: 20, x2: width * 0.4, y2: height - 20 },
        { type: 'line', x1: width * 0.4, y1: height * 0.5, x2: width - 20, y2: height * 0.5 },
        { type: 'line', x1: 20, y1: height * 0.6, x2: width * 0.4, y2: height * 0.6 },
        
        // Room arches (Doors)
        { type: 'arc', cx: width * 0.4, cy: height * 0.3, r: 25, sAngle: 1.5 * Math.PI, eAngle: 2 * Math.PI },
        { type: 'arc', cx: width * 0.6, cy: height * 0.5, r: 20, sAngle: 0, eAngle: 0.5 * Math.PI },
        
        // Grid indicators
        { type: 'line', x1: width * 0.15, y1: 10, x2: width * 0.15, y2: height - 10, style: 'rgba(255,255,255,0.08)' },
        { type: 'line', x1: width * 0.75, y1: 10, x2: width * 0.75, y2: height - 10, style: 'rgba(255,255,255,0.08)' },
        { type: 'line', x1: 10, y1: height * 0.25, x2: width - 10, y2: height * 0.25, style: 'rgba(255,255,255,0.08)' },
        
        // Dimension label measurements
        { type: 'line', x1: 30, y1: 10, x2: width * 0.4 - 10, y2: 10, label: '8.4m' },
        { type: 'line', x1: width * 0.4 + 10, y1: 10, x2: width - 30, y2: 10, label: '12.2m' }
    ];

    let currentPathIndex = 0;
    let t = 0; // drawing percentage of current line [0, 1]
    const speed = 0.08; // speed of drawing

    function draw() {
        // Draw grid coordinate points first
        ctx.fillStyle = '#05070C';
        ctx.fillRect(0, 0, width, height);

        // Subtly draw background dots
        ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
        for (let x = 10; x < width; x += 20) {
            for (let y = 10; y < height; y += 20) {
                ctx.fillRect(x, y, 1, 1);
            }
        }

        // Draw already completed paths
        for (let i = 0; i < currentPathIndex; i++) {
            drawPath(ctx, paths[i], 1);
        }

        // Draw current path in progress
        if (currentPathIndex < paths.length) {
            drawPath(ctx, paths[currentPathIndex], t);
            t += speed;
            if (t >= 1) {
                t = 0;
                currentPathIndex++;
            }
            activeBlueprintReqId = requestAnimationFrame(draw);
        } else {
            // All drawn, stop animation
            activeBlueprintReqId = null;
        }
    }

    draw();
}

function drawPath(ctx, path, ratio) {
    ctx.beginPath();
    ctx.strokeStyle = path.style || 'rgba(201, 169, 110, 0.4)'; // Gold border
    ctx.lineWidth = 1;
    
    if (path.type === 'line') {
        const cx = path.x1 + (path.x2 - path.x1) * ratio;
        const cy = path.y1 + (path.y2 - path.y1) * ratio;
        ctx.moveTo(path.x1, path.y1);
        ctx.lineTo(cx, cy);
        ctx.stroke();

        // Write measurement label text
        if (path.label && ratio >= 0.8) {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '7px var(--font-heading)';
            ctx.fillText(path.label, (path.x1 + path.x2) / 2 - 10, path.y1 - 3);
        }
    } else if (path.type === 'arc') {
        const start = path.sAngle;
        const end = path.sAngle + (path.eAngle - path.sAngle) * ratio;
        ctx.arc(path.cx, path.cy, path.r, start, end);
        ctx.stroke();
    }
}

/* ==========================================================================
   RENDER FEATURED PROPERTIES GRID
   ========================================================================== */
function renderFeatured(properties) {
    const featuredContainer = document.getElementById('featured-properties-container');
    if (!featuredContainer) return;

    // Filter featured items
    const featured = properties.filter(p => p.featured === true);
    
    let html = '';
    featured.forEach(item => {
        const formattedPrice = item.price >= 1000000 
            ? `$${(item.price / 1000000).toFixed(2)}M` 
            : `$${item.price.toLocaleString()}${item.status === 'Rent' ? '/mo' : ''}`;

        html += `
            <div class="property-card fade-up-trigger">
                <div class="card-image-wrapper">
                    <img src="${item.images[0]}" alt="${item.title}" class="card-image" loading="lazy">
                    <div class="card-overlay"></div>
                    <div class="card-tags">
                        <span class="card-tag">${item.status}</span>
                        <span class="card-tag" style="background:#0F172A; color:#FFF;">${item.type}</span>
                    </div>
                    <button class="card-wishlist-btn" data-id="${item.id}" aria-label="Add to saved list">
                        <i class="fa-solid fa-heart"></i>
                    </button>
                    
                    <!-- Glass details panel overlaid on image -->
                    <div class="card-details-panel glass-panel">
                        <div class="card-location"><i class="fa-solid fa-location-dot"></i> ${item.location}</div>
                        <h3 class="card-title">${item.title}</h3>
                        <div class="card-specs">
                            <span><i class="fa-solid fa-bed"></i> ${item.bedrooms || 'N/A'} Beds</span>
                            <span><i class="fa-solid fa-bath"></i> ${item.bathrooms || 'N/A'} Baths</span>
                            <span><i class="fa-solid fa-ruler-combined"></i> ${item.area} M²</span>
                        </div>
                        <div class="card-footer">
                            <span class="card-price">${formattedPrice}</span>
                            <a href="property.html?id=${item.id}" class="card-link">View Details <i class="fa-solid fa-arrow-right"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    featuredContainer.innerHTML = html;
    
    // Trigger scroll-triggered fades on newly loaded cards
    setTimeout(() => {
        const triggers = featuredContainer.querySelectorAll('.fade-up-trigger');
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        triggers.forEach(el => observer.observe(el));
        
        // Sync wishlist button UI active states
        updateWishlistUI();
    }, 100);
}

/* ==========================================================================
   FLAT SEARCH BAR ROUTING
   ========================================================================== */
function initSearchSubmit(properties) {
    const tabs = document.querySelectorAll('.search-tab');
    const submitBtn = document.getElementById('search-submit-btn');
    const locationSelect = document.getElementById('search-location-select');
    const typeSelect = document.getElementById('search-type-select');
    const priceSelect = document.getElementById('search-price-select');
    const bedsSelect = document.getElementById('search-beds-select');

    let activeStatus = 'Buy';

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeStatus = tab.getAttribute('data-status');
        });
    });

    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const city = locationSelect.value;
            const type = typeSelect.value;
            const maxPrice = priceSelect.value;
            const beds = bedsSelect.value;

            // Route to properties page with URL search params
            let params = new URLSearchParams();
            params.set('status', activeStatus);
            if (city) params.set('city', city);
            if (type) params.set('type', type);
            if (maxPrice) params.set('maxPrice', maxPrice);
            if (beds) params.set('beds', beds);

            window.location.href = `properties.html?${params.toString()}`;
        });
    }
}
