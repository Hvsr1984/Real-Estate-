/* js/search.js - Listings Filter Dashboard & Search Engine */

import { initListingsMap, plotPropertyMarkers, focusMapOnCoordinates } from './map.js';
import { updateWishlistUI } from './app.js';
import { updateCompareSlots } from './compare.js';

document.addEventListener('DOMContentLoaded', () => {
    initSearchEngine();
});

function initSearchEngine() {
    const grid = document.getElementById('showroom-grid');
    const countLabel = document.getElementById('results-count-label');
    
    // Inputs
    const keywordInput = document.getElementById('keyword-search-input');
    const citySelect = document.getElementById('filter-city-select');
    const typeSelect = document.getElementById('filter-type-select');
    const priceSlider = document.getElementById('price-range-slider');
    const priceLabel = document.getElementById('price-slider-label');
    const bedsSelect = document.getElementById('filter-beds-select');
    const statusSelect = document.getElementById('filter-status-select');
    const sortSelect = document.getElementById('sort-selector');
    const checkboxes = document.querySelectorAll('.amenity-checkbox');

    if (!grid) return;

    let properties = [];
    let filteredProperties = [];

    // Initialize Map
    initListingsMap('listings-map');

    // Load Properties from JSON + Local Storage CMS Database
    fetch('../data/properties.json')
        .then(res => res.json())
        .then(seedData => {
            const cmsDb = JSON.parse(localStorage.getItem('properties_db')) || [];
            properties = [...seedData, ...cmsDb];
            
            // Parse URL Parameters for search redirects
            parseUrlParameters();

            // Run initial render
            filterAndRender();
        });

    // Listeners
    if (keywordInput) keywordInput.addEventListener('input', filterAndRender);
    if (citySelect) citySelect.addEventListener('change', filterAndRender);
    if (typeSelect) typeSelect.addEventListener('change', filterAndRender);
    if (bedsSelect) bedsSelect.addEventListener('change', filterAndRender);
    if (statusSelect) statusSelect.addEventListener('change', filterAndRender);
    if (sortSelect) sortSelect.addEventListener('change', filterAndRender);
    checkboxes.forEach(chk => chk.addEventListener('change', filterAndRender));

    if (priceSlider && priceLabel) {
        priceSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            priceLabel.textContent = val >= 1000000 
                ? `$${(val / 1000000).toFixed(2)}M` 
                : `$${val.toLocaleString()}`;
            filterAndRender();
        });
    }

    function parseUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        const status = urlParams.get('status');
        const city = urlParams.get('city');
        const type = urlParams.get('type');
        const maxPrice = urlParams.get('maxPrice');
        const beds = urlParams.get('beds');

        if (status && statusSelect) statusSelect.value = status;
        if (city && citySelect) citySelect.value = city;
        if (type && typeSelect) typeSelect.value = type;
        if (beds && bedsSelect) bedsSelect.value = beds;
        
        if (maxPrice && priceSlider && priceLabel) {
            priceSlider.value = maxPrice;
            const val = parseInt(maxPrice);
            priceLabel.textContent = val >= 1000000 
                ? `$${(val / 1000000).toFixed(2)}M` 
                : `$${val.toLocaleString()}`;
        }
    }

    function filterAndRender() {
        const keyword = keywordInput ? keywordInput.value.toLowerCase() : '';
        const city = citySelect ? citySelect.value : '';
        const type = typeSelect ? typeSelect.value : '';
        const maxPrice = priceSlider ? parseInt(priceSlider.value) : 20000000;
        const beds = bedsSelect && bedsSelect.value ? parseInt(bedsSelect.value) : 0;
        const status = statusSelect ? statusSelect.value : '';
        const sort = sortSelect ? sortSelect.value : 'recent';
        
        const selectedAmenities = [];
        checkboxes.forEach(chk => {
            if (chk.checked) selectedAmenities.push(chk.value);
        });

        // Filter Logic
        filteredProperties = properties.filter(prop => {
            const matchesKeyword = prop.title.toLowerCase().includes(keyword) || 
                                   prop.description.toLowerCase().includes(keyword) ||
                                   prop.location.toLowerCase().includes(keyword);
            const matchesCity = !city || prop.city === city;
            const matchesType = !type || prop.type === type;
            const matchesPrice = prop.price <= maxPrice;
            const matchesBeds = !beds || prop.bedrooms >= beds;
            const matchesStatus = !status || prop.status === status;
            
            const matchesAmenities = selectedAmenities.every(amenity => 
                prop.amenities && prop.amenities.includes(amenity)
            );

            return matchesKeyword && matchesCity && matchesType && matchesPrice && matchesBeds && matchesStatus && matchesAmenities;
        });

        // Sort Logic
        if (sort === 'price-low') {
            filteredProperties.sort((a, b) => a.price - b.price);
        } else if (sort === 'price-high') {
            filteredProperties.sort((a, b) => b.price - a.price);
        } else if (sort === 'luxury') {
            filteredProperties.sort((a, b) => b.luxuryScore - a.luxuryScore);
        } else if (sort === 'area') {
            filteredProperties.sort((a, b) => b.area - a.area);
        } else {
            // default recent (by ID sequence or database additions)
            filteredProperties.sort((a, b) => b.id.localeCompare(a.id));
        }

        // Render Count
        if (countLabel) countLabel.textContent = filteredProperties.length;

        // Render Grids
        renderGrid(filteredProperties);

        // Update Map Markers
        plotPropertyMarkers(filteredProperties);
    }

    function renderGrid(list) {
        if (!grid) return;
        
        if (list.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-folder-open" style="font-size: 3rem; color: var(--accent-gold); margin-bottom: 1.5rem;"></i>
                    <p>No luxury residences match your active filters.</p>
                </div>
            `;
            return;
        }

        let html = '';
        list.forEach(item => {
            const formattedPrice = item.price >= 1000000 
                ? `$${(item.price / 1000000).toFixed(2)}M` 
                : `$${item.price.toLocaleString()}${item.status === 'Rent' ? '/mo' : ''}`;

            html += `
                <div class="property-card" data-id="${item.id}" style="opacity: 0; transform: translateY(20px); animation: fadeInUp 0.4s ease forwards;">
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
                        
                        <!-- Property Comparison Check -->
                        <label class="card-compare-chk" data-id="${item.id}">
                            <input type="checkbox" class="compare-chkbox" data-id="${item.id}">
                            <span>Compare</span>
                        </label>
                        
                        <!-- Overlaid Glass card details -->
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
        
        grid.innerHTML = html;

        // Animate fading cards
        grid.querySelectorAll('.property-card').forEach((card, idx) => {
            card.style.animationDelay = `${idx * 0.05}s`;
            
            // Hover mouse panning map focus trigger
            card.addEventListener('mouseenter', () => {
                const target = list.find(item => item.id === card.getAttribute('data-id'));
                if (target && target.coordinates) {
                    focusMapOnCoordinates(target.coordinates[0], target.coordinates[1], 12);
                }
            });
        });

        // Sync Wishlist buttons UI active states
        updateWishlistUI();

        // Sync Compare check boxes
        updateCompareSlots();
    }

    // 6. Mobile filter sheet triggers V6
    const mobileFilterTrigger = document.getElementById('mobile-filter-trigger');
    const mobileFilterClose = document.getElementById('mobile-filter-close');
    const filterBox = document.querySelector('.filters-glass-box');
    const backdrop = document.querySelector('.drawer-backdrop');

    if (mobileFilterTrigger && filterBox && backdrop) {
        mobileFilterTrigger.addEventListener('click', () => {
            filterBox.classList.add('active');
            backdrop.classList.add('active');
            document.body.style.overflow = 'hidden'; /* Lock scrolling */
        });

        const closeFilter = () => {
            filterBox.classList.remove('active');
            if (!document.querySelector('.side-drawer.active')) {
                backdrop.classList.remove('active');
                document.body.style.overflow = ''; /* Restore scrolling */
            }
        };

        if (mobileFilterClose) mobileFilterClose.addEventListener('click', closeFilter);
        backdrop.addEventListener('click', closeFilter);
    }
}
