/* js/wishlist.js - Wishlist Portfolio Utilities: Shares & Recently Viewed */

import { showToast } from './app.js';

// Add current property to recently viewed queue
export function trackRecentlyViewed(propertyId) {
    if (!propertyId) return;
    
    let viewed = JSON.parse(localStorage.getItem('recently_viewed')) || [];
    
    // Remove if already exists to push to front
    const index = viewed.indexOf(propertyId);
    if (index !== -1) {
        viewed.splice(index, 1);
    }
    
    // Add to beginning
    viewed.unshift(propertyId);
    
    // Keep maximum of 3 items
    if (viewed.length > 3) {
        viewed.pop();
    }
    
    localStorage.setItem('recently_viewed', JSON.stringify(viewed));
}

// Render Recently Viewed slider or list
export function renderRecentlyViewed(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const viewedIds = JSON.parse(localStorage.getItem('recently_viewed')) || [];
    if (viewedIds.length === 0) {
        container.innerHTML = `<p style="font-size:0.9rem; color:var(--text-secondary);">No recently viewed properties.</p>`;
        return;
    }

    fetch('../data/properties.json')
        .then(res => res.json())
        .then(properties => {
            const cmsDb = JSON.parse(localStorage.getItem('properties_db')) || [];
            const combined = [...properties, ...cmsDb];
            
            const matched = combined.filter(p => viewedIds.includes(p.id));
            
            let html = '';
            matched.forEach(item => {
                const formattedPrice = item.price >= 1000000 
                    ? `$${(item.price / 1000000).toFixed(2)}M` 
                    : `$${item.price.toLocaleString()}`;

                html += `
                    <div class="glass-panel" style="display:flex; gap:1rem; padding:1rem; align-items:center;">
                        <img src="${item.images[0]}" alt="${item.title}" style="width:60px; height:60px; object-fit:cover; border-radius:var(--border-radius-sm);">
                        <div>
                            <h5 style="font-size:0.9rem; margin-bottom:0.25rem;"><a href="property.html?id=${item.id}">${item.title}</a></h5>
                            <span style="color:var(--accent-gold); font-size:0.85rem; font-weight:600;">${formattedPrice}</span>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        });
}

// Share Property Link utility
export function shareProperty(propertyId, title) {
    const shareUrl = `${window.location.origin}/pages/property.html?id=${propertyId}`;
    
    if (navigator.share) {
        navigator.share({
            title: `LuxeHaven | ${title}`,
            text: `Explore this stunning architectural masterpiece on LuxeHaven.`,
            url: shareUrl
        })
        .then(() => showToast('Shared successfully', 'success'))
        .catch(() => copyToClipboard(shareUrl));
    } else {
        copyToClipboard(shareUrl);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            showToast('Sharing link copied to clipboard', 'success');
        })
        .catch(() => {
            showToast('Unable to copy link', 'error');
        });
}
