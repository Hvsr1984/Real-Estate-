/* js/app.js - Global App Orchestrator & AI Concierge */

import { initCustomCursor } from './cursor.js';
import { initSmoothScrolling } from './lenis.js';
import { initGsapAnimations } from './gsap.js';
import './auth.js';
import '../test/validation.test.js';
import { calculateDistance } from './utils/geolocation.js';
import { formatPrice } from './utils/formatters.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Preloader Progress Count
    initPreloader();

    // 2. Custom Cursor Physics
    initCustomCursor();

    // 3. Theme Toggle (Light / Dark)
    initThemeToggle();

    // 4. Header Scroll Behaviors
    initHeaderScroll();

    // 5. Drawer Controls (Wishlist Side Panel)
    initDrawerControls();

    // 6. Wishlist Management (LocalStorage)
    initWishlist();

    // 7. Dynamic AI Concierge Dialogues
    initAIChatbot();

    // 8. Cookie Banner Handling
    initCookieBanner();

    // 9. Mobile Navigation Drawer
    initMobileNav();

    // 10. Smooth Scrolling (Lenis)
    initSmoothScrolling();

    // 11. Choreographed entries (GSAP)
    initGsapAnimations();

    // 12. Global Scroll Locking for Active Modals/Drawers
    initModalScrollLock();
});

/* ==========================================================================
   1. PRELOADER
   ========================================================================== */
function initPreloader() {
    const preloader = document.querySelector('.preloader');
    const bar = document.querySelector('.preloader-bar');
    const counter = document.querySelector('.preloader-counter');
    
    if (!preloader) return;

    let progress = 0;
    const duration = 1200; // 1.2s loading simulation
    const intervalTime = 15;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
        progress += step;
        if (progress >= 100) {
            progress = 100;
            clearInterval(timer);
            setTimeout(() => {
                preloader.classList.add('fade-out');
                // Trigger scroll reveals
                initScrollReveals();
            }, 300);
        }
        if (bar) bar.style.width = `${progress}%`;
        if (counter) counter.textContent = `${Math.floor(progress)}%`;
    }, intervalTime);
}

/* ==========================================================================
   2. SCROLL REVEALS (Intersection Observer)
   ========================================================================== */
function initScrollReveals() {
    const triggers = document.querySelectorAll('.fade-up-trigger');
    const imageWrappers = document.querySelectorAll('.reveal-wrapper');
    
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                entry.target.classList.add('revealed');
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    triggers.forEach(el => observer.observe(el));
    imageWrappers.forEach(el => observer.observe(el));
}

/* ==========================================================================
   3. THEME TOGGLE
   ========================================================================== */
function initThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (!themeBtn) return;

    const icon = themeBtn.querySelector('i');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeBtn.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme');
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('theme', nextTheme);
        updateThemeIcon(nextTheme);
        showToast(`Switched to ${nextTheme} mode`, 'success');
    });

    function updateThemeIcon(theme) {
        if (icon) {
            icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
    }
}

/* ==========================================================================
   4. HEADER SCROLL EFFECT
   ========================================================================== */
function initHeaderScroll() {
    const header = document.querySelector('.main-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

/* ==========================================================================
   5. DRAWER CONTROLS
   ========================================================================== */
function initDrawerControls() {
    const backdrop = document.querySelector('.drawer-backdrop');
    const wishlistDrawer = document.getElementById('wishlist-drawer');
    const wishlistBtn = document.getElementById('wishlist-toggle-btn');
    const closeBtn = document.getElementById('drawer-close-btn');

    if (!wishlistDrawer || !backdrop) return;

    const openDrawer = () => {
        wishlistDrawer.classList.add('active');
        backdrop.classList.add('active');
    };

    const closeDrawer = () => {
        wishlistDrawer.classList.remove('active');
        backdrop.classList.remove('active');
    };

    if (wishlistBtn) wishlistBtn.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);
}

/* ==========================================================================
   6. WISHLIST MANAGEMENT
   ========================================================================== */
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

function initWishlist() {
    updateWishlistUI();

    // Delegate wishlist button click events
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.card-wishlist-btn');
        if (btn) {
            e.preventDefault();
            const id = btn.getAttribute('data-id');
            toggleWishlistItem(id, btn);
        }
    });
}

function toggleWishlistItem(id, btnElement) {
    const index = wishlist.indexOf(id);
    if (index === -1) {
        wishlist.push(id);
        if (btnElement) btnElement.classList.add('active');
        showToast('Property saved to wishlist', 'success');
    } else {
        wishlist.splice(index, 1);
        if (btnElement) btnElement.classList.remove('active');
        showToast('Property removed from wishlist', 'success');
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
}

export function updateWishlistUI() {
    const badges = document.querySelectorAll('.wishlist-count-badge');
    badges.forEach(badge => badge.textContent = wishlist.length);

    // Update icons on grid buttons
    document.querySelectorAll('.card-wishlist-btn').forEach(btn => {
        const id = btn.getAttribute('data-id');
        if (wishlist.includes(id)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Draw drawer list
    const container = document.querySelector('.drawer-content');
    if (!container) return;

    if (wishlist.length === 0) {
        container.innerHTML = `<div class="drawer-empty-msg"><i class="fa-regular fa-heart" style="font-size: 2.5rem; color: var(--accent-gold); margin-bottom: 1rem;"></i><p>Your wishlist is empty.</p></div>`;
        return;
    }

    // Fetch properties list to display
    fetch('../data/properties.json')
        .then(res => res.json())
        .then(properties => {
            // Include dynamically added items from localStorage database if available
            const localProperties = JSON.parse(localStorage.getItem('properties_db')) || [];
            const combined = [...properties, ...localProperties];
            
            const matched = combined.filter(p => wishlist.includes(p.id));
            
            let html = '';
            matched.forEach(item => {
                const formattedPrice = item.price >= 1000000 
                    ? `$${(item.price / 1000000).toFixed(2)}M` 
                    : `$${item.price.toLocaleString()}${item.status === 'Rent' ? '/mo' : ''}`;

                html += `
                    <div class="drawer-item" data-id="${item.id}">
                        <img src="${item.images[0]}" alt="${item.title}" class="drawer-item-img">
                        <div class="drawer-item-details">
                            <h4>${item.title}</h4>
                            <p><i class="fa-solid fa-location-dot"></i> ${item.location}</p>
                            <div class="drawer-item-price">${formattedPrice}</div>
                        </div>
                        <i class="fa-solid fa-trash-can drawer-item-remove" data-id="${item.id}"></i>
                    </div>
                `;
            });
            container.innerHTML = html;

            // Remove listeners inside drawer
            container.querySelectorAll('.drawer-item-remove').forEach(removeBtn => {
                removeBtn.addEventListener('click', () => {
                    const id = removeBtn.getAttribute('data-id');
                    toggleWishlistItem(id, null);
                });
            });
        });
}

/* ==========================================================================
   7. AI CONCIERGE CHATBOT
   ========================================================================== */
function initAIChatbot() {
    const trigger = document.querySelector('.ai-concierge-trigger');
    const windowEl = document.querySelector('.ai-chat-window');
    const closeBtn = document.querySelector('.chat-header-close');
    const sendBtn = document.querySelector('.chat-send-btn');
    const input = document.getElementById('chat-input-field');
    const messagesContainer = document.querySelector('.chat-messages');

    if (!trigger || !windowEl || !closeBtn) return;

    trigger.addEventListener('click', () => {
        windowEl.classList.toggle('active');
    });

    closeBtn.addEventListener('click', () => {
        windowEl.classList.remove('active');
    });

    // suggested choices trigger
    document.addEventListener('click', (e) => {
        const choiceBtn = e.target.closest('.chat-choice-btn');
        if (choiceBtn) {
            const query = choiceBtn.getAttribute('data-choice');
            handleUserMessage(query);
        }
    });

    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            const val = input.value.trim();
            if (val) {
                handleUserMessage(val);
                input.value = '';
            }
        });
    }

    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const val = input.value.trim();
                if (val) {
                    handleUserMessage(val);
                    input.value = '';
                }
            }
        });
    }

    function handleUserMessage(msg) {
        appendMessage(msg, 'user');
        simulateBotTyping(msg);
    }

    function appendMessage(text, sender) {
        const bubble = document.createElement('div');
        bubble.className = `chat-msg ${sender}`;
        bubble.innerHTML = text;
        messagesContainer.appendChild(bubble);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function simulateBotTyping(userText) {
        // Typing indicator
        const indicator = document.createElement('div');
        indicator.className = 'chat-msg bot typing-indicator';
        indicator.innerHTML = `<span style="display:inline-block;animation:bounce 1.4s infinite both;">•</span><span style="display:inline-block;animation:bounce 1.4s infinite both 0.2s;">•</span><span style="display:inline-block;animation:bounce 1.4s infinite both 0.4s;">•</span>`;
        messagesContainer.appendChild(indicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        setTimeout(() => {
            indicator.remove();
            const botReply = generateResponse(userText);
            appendMessage(botReply, 'bot');
        }, 1200);
    }

    function generateResponse(text) {
        const lower = text.toLowerCase();
        
        // Read the properties from LocalStorage database
        const dbKey = 'properties_db';
        const propertiesData = localStorage.getItem(dbKey);
        let properties = [];
        try {
            properties = propertiesData ? JSON.parse(propertiesData) : [];
        } catch(e) {
            properties = [];
        }
        
        // Filter approved properties
        properties = properties.filter(p => p.moderationStatus === 'Approved');

        // Parse BHK (e.g. 3BHK)
        let requestedBhk = null;
        const bhkMatch = lower.match(/(\d)\s*(bhk|bedroom|bed)/);
        if (bhkMatch) {
            requestedBhk = parseInt(bhkMatch[1]);
        }

        // Parse Price Limit (e.g. under 5 Cr, below 50 Crore)
        let maxPrice = null;
        if (lower.includes('cr') || lower.includes('crore')) {
            const crMatch = lower.match(/(?:under|below|max|budget of)?\s*(\d+(?:\.\d+)?)\s*(?:cr|crore)/);
            if (crMatch) maxPrice = parseFloat(crMatch[1]) * 10000000;
        } else if (lower.includes('lakh') || lower.includes('lk')) {
            const lakhMatch = lower.match(/(?:under|below|max|budget of)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lk|l)/);
            if (lakhMatch) maxPrice = parseFloat(lakhMatch[1]) * 100000;
        }

        // Parse City
        let requestedCity = null;
        const cities = ['mumbai', 'gurgaon', 'bangalore', 'noida', 'delhi', 'goa'];
        cities.forEach(c => {
            if (lower.includes(c)) requestedCity = c;
        });

        // Parse property Type
        let requestedType = null;
        if (lower.includes('villa')) requestedType = 'Villa';
        else if (lower.includes('penthouse')) requestedType = 'Penthouse';
        else if (lower.includes('apartment') || lower.includes('flat')) requestedType = 'Apartment';

        // Parse Nearby / GPS
        let isNearby = lower.includes('near me') || lower.includes('nearby') || lower.includes('close');

        // Filter
        let matches = properties;
        if (requestedCity) {
            matches = matches.filter(p => p.city.toLowerCase() === requestedCity);
        }
        if (requestedBhk) {
            matches = matches.filter(p => p.bhk === requestedBhk);
        }
        if (requestedType) {
            matches = matches.filter(p => p.propertyType === requestedType);
        }
        if (maxPrice) {
            matches = matches.filter(p => (p.price || p.rentPrice) <= maxPrice);
        }

        let nearbyMsg = '';
        let userCoords = null;
        
        // Grab current mock/real location if available in active showroom controllers
        if (window.SearchControllerInstance && window.SearchControllerInstance.userLocation) {
            userCoords = window.SearchControllerInstance.userLocation;
        }

        if (isNearby && userCoords) {
            matches = matches.map(p => {
                const dist = calculateDistance(userCoords.lat, userCoords.lng, p.coordinates[0], p.coordinates[1]);
                return { ...p, distance: dist };
            });
            matches.sort((a, b) => a.distance - b.distance);
            nearbyMsg = ` sorted by proximity to your coordinates`;
        }

        if (matches.length === 0) {
            return `I found no luxury properties matching your query in our database. You can search all listings in the <a href="properties.html" style="color:var(--accent-gold);text-decoration:underline;">Properties Showroom</a>.`;
        }

        let reply = `Here are the luxury curations matching your query${nearbyMsg}:<br><br>`;
        matches.slice(0, 3).forEach(item => {
            const formattedPrice = formatPrice(item.price || item.rentPrice, item.status);
            
            reply += `
                <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(201,169,110,0.2); border-radius:4px; padding:0.75rem; margin-bottom:0.75rem; display:flex; gap:0.75rem; align-items:center;">
                    <img src="${item.images[0]}" style="width:60px; height:50px; object-fit:cover; border-radius:2px;">
                    <div style="flex-grow:1; min-width:0; text-align:left;">
                        <h5 style="margin:0; font-size:0.85rem; color:#FFF; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${item.title}</h5>
                        <p style="margin:2px 0 0 0; font-size:0.7rem; color:rgba(255,255,255,0.5);">${item.locality || item.city}</p>
                        <div style="margin-top:4px; display:flex; justify-content:space-between; align-items:center; font-size:0.75rem;">
                            <span style="color:#C9A96E; font-weight:600;">${formattedPrice}</span>
                            <a href="property.html?id=${item.id}" style="color:rgba(255,255,255,0.8); text-decoration:underline;">View <i class="fa-solid fa-arrow-right" style="font-size:0.6rem;"></i></a>
                        </div>
                    </div>
                </div>
            `;
        });

        if (matches.length > 3) {
            reply += `<a href="properties.html" style="color:var(--accent-gold); font-size:0.75rem; text-decoration:underline;">Show ${matches.length - 3} more matches in Showroom <i class="fa-solid fa-angles-right"></i></a>`;
        }
        
        return reply;
    }
}

/* ==========================================================================
   8. COOKIE CONSENT
   ========================================================================== */
function initCookieBanner() {
    const banner = document.querySelector('.cookie-banner');
    if (!banner) return;

    const accepted = localStorage.getItem('cookiesAccepted');
    if (!accepted) {
        setTimeout(() => {
            banner.classList.add('active');
        }, 2000);
    }

    banner.querySelector('.cookie-btn-accept').addEventListener('click', () => {
        localStorage.setItem('cookiesAccepted', 'true');
        banner.classList.remove('active');
        showToast('Cookies accepted', 'success');
    });

    banner.querySelector('.cookie-btn-decline').addEventListener('click', () => {
        localStorage.setItem('cookiesAccepted', 'false');
        banner.classList.remove('active');
    });
}

/* ==========================================================================
   9. MOBILE NAVIGATION PANELS
   ========================================================================== */
function initMobileNav() {
    const openBtn = document.querySelector('.hamburger-btn');
    const panel = document.querySelector('.mobile-nav-panel');
    const closeBtn = document.querySelector('.mobile-nav-close');

    if (!openBtn || !panel || !closeBtn) return;

    openBtn.addEventListener('click', () => {
        panel.classList.add('active');
        document.body.style.overflow = 'hidden'; /* Lock scroll */
    });

    const closeMenu = () => {
        panel.classList.remove('active');
        document.body.style.overflow = ''; /* Restore scroll */
    };

    closeBtn.addEventListener('click', closeMenu);

    // Close when clicking nav link inside mobile panel
    panel.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}

/* ==========================================================================
   TOAST NOTIFICATION ENGINE
   ========================================================================== */
export function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `<i class="${type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toast-slide 0.3s ease reverse forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

/* ==========================================================================
   12. MUTATION OBSERVER FOR SCROLL LOCKING ON ACTIVE MODALS/DRAWERS
   ========================================================================== */
function initModalScrollLock() {
    const observer = new MutationObserver(() => {
        const activeModalsOrDrawers = document.querySelectorAll(
            '.modal-overlay.active, .side-drawer.active, .crud-form-drawer.active, .compare-modal-overlay.active, .filters-glass-box.active, .mobile-nav-panel.active'
        );
        if (activeModalsOrDrawers.length > 0) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });

    observer.observe(document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ['class']
    });
}

