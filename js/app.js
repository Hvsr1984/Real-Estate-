/* js/app.js - Global App Orchestrator & AI Concierge */

import { initCustomCursor } from './cursor.js';
import { initSmoothScrolling } from './lenis.js';
import { initGsapAnimations } from './gsap.js';
import './auth.js';

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
        
        if (lower.includes('roi') || lower.includes('investment') || lower.includes('yield')) {
            return `LuxeHaven specializes in high-cap assets. Our top investment yield returns belong to **Aetheria Sky Penthouse** in Miami (7.1% expected ROI) and **The Planetarium Villa** in LA (6.8% ROI). You can analyze details in the <a href="properties.html?sort=luxury" style="color:var(--accent-gold);text-decoration:underline;">Residences Grid</a>.`;
        }
        if (lower.includes('beverly') || lower.includes('los angeles') || lower.includes('la')) {
            return `In the Beverly Hills/LA quadrant, we curate **The Planetarium Villa** ($12.85M) and Malibu's buildable oceanfront parcel, **Soleil Coastline Peninsula** ($18.5M). Review specifications here: <a href="properties.html?city=Los+Angeles" style="color:var(--accent-gold);text-decoration:underline;">Explore LA Listings</a>.`;
        }
        if (lower.includes('spa') || lower.includes('pool') || lower.includes('amenities')) {
            return `Our spa-equipped compounds include **The Planetarium Villa** (Private Spa & Infinity Pool) and Tokyo's **Neo-Tokyo Sanctuary** (Rooftop Wooden Onsen). View spa properties: <a href="properties.html" style="color:var(--accent-gold);text-decoration:underline;">Browse All Residences</a>.`;
        }
        if (lower.includes('villa')) {
            return `I have outstanding beachfront and hillside villas. For instance, **The Planetarium Villa** in Beverly Hills is available at $12.85M with 6.8% estimated ROI. Would you like to <a href="property.html?id=prop-1" style="color:var(--accent-gold);text-decoration:underline;">view full specifications</a>?`;
        }
        if (lower.includes('miami') || lower.includes('penthouse')) {
            return `Our signature sky retreat, **Aetheria Sky Penthouse** in Brickell Miami, features panoramic sunset vistas at $8.45M. You can explore its virtual tour and financial ROI here: <a href="property.html?id=prop-2" style="color:var(--accent-gold);text-decoration:underline;">Aetheria Details</a>.`;
        }
        if (lower.includes('rent')) {
            return `For leasing luxury, I suggest **The Obsidian Pavilion** in Aspen ($25,000/mo) or **Neo-Tokyo Penthouse** ($18,000/mo). View details here: <a href="properties.html?status=Rent" style="color:var(--accent-gold);text-decoration:underline;">Browse Rental listings</a>.`;
        }
        if (lower.includes('contact') || lower.includes('viewing') || lower.includes('book')) {
            return `I can schedule a private viewing. Please fill out our scheduling agenda at the <a href="contact.html" style="color:var(--accent-gold);text-decoration:underline;">Viewing Desk</a>, or connect immediately via <a href="https://wa.me/13105550192" style="color:var(--accent-gold);text-decoration:underline;">WhatsApp curating</a>.`;
        }
        
        return `Hello, I am your LuxeHaven Digital Butler. I can help search our luxury villas, penthouses, plots, and arrange private concierge viewings. Are you looking for properties in **Los Angeles**, **Miami**, or **Tokyo**?`;
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

    closeBtn.addEventListener('click', () => {
        panel.classList.remove('active');
        document.body.style.overflow = ''; /* Restore scroll */
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
