/* js/auth.js - Dynamic Authentication Modals & OTP Verification */

import { showToast } from './app.js';
import { initFirebase } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    // Sync Firebase configurations
    initFirebase();

    // Check session
    syncAuthUiState();

    // Inject Auth Modal into DOM
    injectAuthModal();

    // Bind triggers
    bindAuthTriggers();
});

/* ==========================================================================
   DYNAMIC AUTH MODAL INJECTION
   ========================================================================= */
function injectAuthModal() {
    if (document.getElementById('auth-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'auth-modal-overlay';

    overlay.innerHTML = `
        <div class="auth-modal glass-panel">
            <i class="fa-solid fa-xmark modal-close" id="auth-modal-close"></i>
            
            <div class="auth-tabs">
                <div class="auth-tab active" data-auth-form="login-form-panel">Login</div>
                <div class="auth-tab" data-auth-form="register-form-panel">Register</div>
                <div class="auth-tab" data-auth-form="otp-form-panel">Phone SMS</div>
            </div>

            <!-- TAB 01: EMAIL LOGIN -->
            <div class="auth-form-panel active" id="login-form-panel">
                <form class="auth-form" id="email-login-form">
                    <div class="auth-input-group">
                        <label>Email Address</label>
                        <input type="email" id="login-email" placeholder="curator@luxehaven.com" required>
                    </div>
                    <div class="auth-input-group">
                        <label>Password</label>
                        <input type="password" id="login-password" placeholder="••••••••" required>
                    </div>
                    <a href="#" id="forgot-password-link" style="font-size:0.75rem; color:var(--accent-gold); align-self:flex-end;">Forgot Password?</a>
                    <button type="submit" class="btn-primary magnetic" id="login-submit-btn" style="justify-content:center; padding:0.85rem;">Sign In <i class="fa-solid fa-right-to-bracket"></i></button>
                </form>
            </div>

            <!-- TAB 02: EMAIL REGISTER -->
            <div class="auth-form-panel" id="register-form-panel">
                <form class="auth-form" id="email-register-form">
                    <div class="auth-input-group">
                        <label>Full Name</label>
                        <input type="text" id="register-name" placeholder="Alexander Sterling" required>
                    </div>
                    <div class="auth-input-group">
                        <label>Email Address</label>
                        <input type="email" id="register-email" placeholder="client@domain.com" required>
                    </div>
                    <div class="auth-input-group">
                        <label>Password</label>
                        <input type="password" id="register-password" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn-primary magnetic" style="justify-content:center; padding:0.85rem;">Create Account <i class="fa-solid fa-user-plus"></i></button>
                </form>
            </div>

            <!-- TAB 03: PHONE AUTH & OTP -->
            <div class="auth-form-panel" id="otp-form-panel">
                <!-- Phone input stage -->
                <form class="auth-form" id="phone-request-form">
                    <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem;">Enter your phone coordinates to receive a 6-digit verification code via Firebase SMS.</p>
                    <div class="auth-input-group">
                        <label>Phone Number</label>
                        <input type="tel" id="otp-phone-input" placeholder="+1 (310) 555-0192" required>
                    </div>
                    <button type="submit" class="btn-primary magnetic" style="justify-content:center; padding:0.85rem;">Send Code <i class="fa-solid fa-paper-plane"></i></button>
                </form>

                <!-- Code verify stage (hidden by default) -->
                <form class="auth-form" id="phone-verify-form" style="display:none;">
                    <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem;">We have dispatched an SMS verification payload. Code expires in <span id="otp-timer" style="font-weight:700; color:var(--accent-gold);">59s</span>.</p>
                    <div class="auth-input-group">
                        <label>Enter 6-Digit Code</label>
                        <input type="text" id="otp-code-input" placeholder="123456" maxlength="6" required>
                    </div>
                    <button type="submit" class="btn-primary magnetic" style="justify-content:center; padding:0.85rem;">Verify Code <i class="fa-solid fa-circle-check"></i></button>
                </form>
            </div>

            <div class="oauth-divider"><span>OR CONTINUE WITH</span></div>
            <button class="btn-oauth magnetic" id="google-login-btn"><i class="fa-brands fa-google" style="color:#EA4335;"></i> Google Authentication</button>

        </div>
    `;

    document.body.appendChild(overlay);

    // Bind inner elements listeners
    initAuthModalControls(overlay);
}

function initAuthModalControls(modalOverlay) {
    const tabs = modalOverlay.querySelectorAll('.auth-tab');
    const panels = modalOverlay.querySelectorAll('.auth-form-panel');
    const closeBtn = modalOverlay.querySelector('#auth-modal-close');

    // Switch tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const panelId = tab.getAttribute('data-auth-form');
            modalOverlay.querySelector(`#${panelId}`).classList.add('active');
        });
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('active');
    });

    // Forms handles
    const loginForm = modalOverlay.querySelector('#email-login-form');
    const registerForm = modalOverlay.querySelector('#email-register-form');
    const phoneReqForm = modalOverlay.querySelector('#phone-request-form');
    const phoneVerForm = modalOverlay.querySelector('#phone-verify-form');
    const googleBtn = modalOverlay.querySelector('#google-login-btn');
    const forgotLink = modalOverlay.querySelector('#forgot-password-link');

    // Login Handle
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        setLoadingState(submitBtn, true, 'Signing In...');

        setTimeout(() => {
            const email = loginForm.querySelector('#login-email').value.trim();
            setLoadingState(submitBtn, false);
            
            // Set session
            localStorage.setItem('user_session', JSON.stringify({
                name: email.split('@')[0].toUpperCase(),
                email: email
            }));

            showToast('Welcome back to LuxeHaven Portfolio', 'success');
            modalOverlay.classList.remove('active');
            syncAuthUiState();
        }, 1200);
    });

    // Register Handle
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        setLoadingState(submitBtn, true, 'Creating Account...');

        setTimeout(() => {
            const name = registerForm.querySelector('#register-name').value.trim();
            const email = registerForm.querySelector('#register-email').value.trim();
            setLoadingState(submitBtn, false);

            localStorage.setItem('user_session', JSON.stringify({
                name: name,
                email: email
            }));

            showToast('Account created successfully!', 'success');
            modalOverlay.classList.remove('active');
            syncAuthUiState();
        }, 1200);
    });

    // Phone verification request
    phoneReqForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = phoneReqForm.querySelector('button[type="submit"]');
        setLoadingState(submitBtn, true, 'Sending SMS...');

        setTimeout(() => {
            setLoadingState(submitBtn, false);
            phoneReqForm.style.display = 'none';
            phoneVerForm.style.display = 'flex';
            startOtpCountdown();
        }, 1000);
    });

    // Verification Code Verify
    phoneVerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = phoneVerForm.querySelector('button[type="submit"]');
        setLoadingState(submitBtn, true, 'Verifying...');

        setTimeout(() => {
            setLoadingState(submitBtn, false);
            
            localStorage.setItem('user_session', JSON.stringify({
                name: 'BROKER-MOBILE',
                email: 'phone-auth@luxehaven.com'
            }));

            showToast('Phone number authenticated successfully', 'success');
            modalOverlay.classList.remove('active');
            syncAuthUiState();
        }, 1200);
    });

    // Google Signin
    googleBtn.addEventListener('click', () => {
        showToast('Connecting to Google credentials...', 'success');
        setTimeout(() => {
            localStorage.setItem('user_session', JSON.stringify({
                name: 'ALEXANDER STERLING',
                email: 'sterling@luxehaven.com'
            }));
            showToast('Authenticated via Google account', 'success');
            modalOverlay.classList.remove('active');
            syncAuthUiState();
        }, 1000);
    });

    // Forgot password
    forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('#login-email').value;
        if (!email) {
            showToast('Please input your email coordinate first', 'error');
            return;
        }
        showToast(`Dispatched reset request to ${email}`, 'success');
    });
}

function startOtpCountdown() {
    const label = document.getElementById('otp-timer');
    if (!label) return;
    
    let timerCount = 59;
    const interval = setInterval(() => {
        timerCount--;
        label.textContent = `${timerCount}s`;
        
        if (timerCount <= 0) {
            clearInterval(interval);
            label.textContent = 'Expired';
            showToast('OTP expired. Please try requesting code again.', 'error');
        }
    }, 1000);
}

function setLoadingState(btn, isLoading, text = '') {
    if (isLoading) {
        btn.disabled = true;
        btn.setAttribute('data-orig-html', btn.innerHTML);
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${text}`;
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.getAttribute('data-orig-html');
    }
}

/* ==========================================================================
   TRIGGERS & ROUTING INTERCEPTORS
   ========================================================================== */
function bindAuthTriggers() {
    // Intercept CMS dashboard load without authentication
    if (window.location.pathname.includes('dashboard.html')) {
        const session = localStorage.getItem('user_session');
        if (!session) {
            // Block CMS with auth lock
            const body = document.querySelector('.dashboard-container');
            if (body) {
                body.style.position = 'relative';
                
                const lock = document.createElement('div');
                lock.style.position = 'absolute';
                lock.style.top = '0';
                lock.style.left = '0';
                lock.style.width = '100%';
                lock.style.height = '100%';
                lock.style.background = 'rgba(5, 7, 12, 0.85)';
                lock.style.backdropFilter = 'blur(15px)';
                lock.style.zIndex = '999';
                lock.style.display = 'flex';
                lock.style.flexDirection = 'column';
                lock.style.alignItems = 'center';
                lock.style.justifyContent = 'center';
                lock.style.gap = '2rem';
                lock.id = 'auth-blocker-panel';
                
                lock.innerHTML = `
                    <i class="fa-solid fa-lock" style="font-size:4rem; color:var(--accent-gold); animation: pulse 2s infinite;"></i>
                    <div style="text-align:center;">
                        <h2 style="font-family:var(--font-heading); text-transform:uppercase; color:#FFF; margin-bottom:0.75rem;">CMS Security Lockout</h2>
                        <p style="color:var(--text-secondary); font-size:0.95rem; max-width:400px; margin:0 auto;">Authenticating credentials is required to review platform analytics and execute CRUD listings alterations.</p>
                    </div>
                    <button class="btn-primary magnetic" id="btn-lockout-login">Authenticate Identity <i class="fa-solid fa-user-shield"></i></button>
                `;
                
                body.appendChild(lock);

                document.getElementById('btn-lockout-login').addEventListener('click', () => {
                    const modal = document.getElementById('auth-modal-overlay');
                    if (modal) modal.classList.add('active');
                });
            }
        }
    }
}

export function syncAuthUiState() {
    const session = localStorage.getItem('user_session');
    const headerNav = document.querySelector('.nav-container');

    if (session) {
        // Remove Blocker lock if user logs in
        const blocker = document.getElementById('auth-blocker-panel');
        if (blocker) {
            blocker.remove();
            // Reload dashboard panel values
            if (typeof window.location.reload === 'function' && window.location.pathname.includes('dashboard.html')) {
                window.location.reload();
            }
        }

        // Draw profile icon in navigation
        let userMenu = document.getElementById('navbar-user-profile');
        if (!userMenu && headerNav) {
            const actions = headerNav.querySelector('.nav-actions');
            if (actions) {
                const profileBtn = document.createElement('div');
                profileBtn.id = 'navbar-user-profile';
                profileBtn.style.position = 'relative';
                
                // Gold Avatar
                profileBtn.innerHTML = `
                    <div class="thumb-circle magnetic" id="avatar-trigger" style="width:36px; height:36px; border-color:var(--accent-gold); cursor:pointer; margin-left:0;">
                        <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=80&q=80" alt="Avatar">
                    </div>
                    <!-- Dropdown context menu -->
                    <div class="glass-panel" id="avatar-dropdown" style="display:none; position:absolute; top:2.75rem; right:0; width:180px; padding:1rem; flex-direction:column; gap:0.75rem; z-index:1001;">
                        <a href="dashboard.html" style="font-size:0.85rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em;"><i class="fa-solid fa-chart-line"></i> Dashboard</a>
                        <hr style="border-color:var(--glass-border);">
                        <a href="#" id="navbar-signout-btn" style="font-size:0.85rem; font-weight:600; text-transform:uppercase; color:var(--error); letter-spacing:0.05em;"><i class="fa-solid fa-power-off"></i> Sign Out</a>
                    </div>
                `;

                actions.insertBefore(profileBtn, actions.querySelector('.hamburger-btn'));

                // Bind dropdown toggles
                const trigger = profileBtn.querySelector('#avatar-trigger');
                const dropdown = profileBtn.querySelector('#avatar-dropdown');
                
                trigger.addEventListener('click', () => {
                    dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none';
                });

                // Signout trigger
                profileBtn.querySelector('#navbar-signout-btn').addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('user_session');
                    showToast('Logged out successfully', 'success');
                    profileBtn.remove();
                    
                    // Redirect back if on dashboard
                    if (window.location.pathname.includes('dashboard.html')) {
                        window.location.reload();
                    }
                });
            }
        }
    }
}
