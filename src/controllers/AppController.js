/* js/controllers/AppController.js - Global Platform UI Controller */

import { eventBus } from '../core/eventBus.js';
import { authService } from '../services/auth/authService.js';
import { notificationService } from '../services/notification/notificationService.js';

export class AppController {
    constructor() {
        this.themeKey = 'luxehaven_theme';
    }

    init() {
        this.initTheme();
        this.initHeaderScroll();
        this.initScrollObserver();
        this.initCookieBanner();
        this.initMobileMenu();
        this.initWishlistSync();
    }

    initTheme() {
        const themeToggle = document.getElementById('theme-toggle-btn');
        if (!themeToggle) return;

        const currentTheme = localStorage.getItem(this.themeKey) || 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        this.updateThemeIcon(themeToggle, currentTheme);

        themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', target);
            localStorage.setItem(this.themeKey, target);
            this.updateThemeIcon(themeToggle, target);
            eventBus.emit('theme.changed', target);
        });
    }

    updateThemeIcon(button, theme) {
        const icon = button.querySelector('i');
        if (!icon) return;
        if (theme === 'dark') {
            icon.className = 'fa-solid fa-sun';
        } else {
            icon.className = 'fa-solid fa-moon';
        }
    }

    initHeaderScroll() {
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

    initScrollObserver() {
        const triggers = document.querySelectorAll('.fade-up-trigger');
        const reveals = document.querySelectorAll('.reveal-wrapper');
        
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    entry.target.classList.add('revealed');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

        triggers.forEach(el => observer.observe(el));
        reveals.forEach(el => observer.observe(el));
    }

    initCookieBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (!banner) return;

        const accepted = localStorage.getItem('cookiesAccepted');
        if (accepted === null) {
            setTimeout(() => banner.classList.add('active'), 1500);
        }

        const acceptBtn = document.getElementById('cookie-accept-btn');
        const rejectBtn = document.getElementById('cookie-reject-btn');

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                localStorage.setItem('cookiesAccepted', 'true');
                banner.classList.remove('active');
            });
        }
        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => {
                localStorage.setItem('cookiesAccepted', 'false');
                banner.classList.remove('active');
            });
        }
    }

    initMobileMenu() {
        const trigger = document.querySelector('.hamburger-btn');
        const panel = document.querySelector('.mobile-nav-panel');
        const close = document.querySelector('.mobile-nav-close');

        if (!trigger || !panel || !close) return;

        trigger.addEventListener('click', () => {
            panel.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        const closeMenu = () => {
            panel.classList.remove('active');
            document.body.style.overflow = '';
        };

        close.addEventListener('click', closeMenu);
        panel.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    }

    initWishlistSync() {
        // Track global counts updates
        const updateBadges = () => {
            const list = JSON.parse(localStorage.getItem('wishlist') || '[]');
            document.querySelectorAll('.wishlist-count-badge').forEach(badge => {
                badge.textContent = list.length;
            });
        };
        updateBadges();
        eventBus.on('wishlist.updated', updateBadges);
    }
}
