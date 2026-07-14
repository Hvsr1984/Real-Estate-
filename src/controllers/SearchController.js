/* js/controllers/SearchController.js - UI controller for listings showroom */

import { mapsService } from '../services/maps/mapsService.js';
import { searchService } from '../services/search/searchService.js';
import { propertyService } from '../services/property/propertyService.js';
import { analyticsService } from '../services/analytics/analyticsService.js';
import { eventBus } from '../core/eventBus.js';
import { formatPrice, formatArea, formatPlot } from '../utils/formatters.js';
import { calculateDistance, formatDistance, formatDuration } from '../utils/geolocation.js';

export class SearchController {
    constructor() {
        this.properties = [];
        this.filteredProperties = [];
        this.userLocation = null; // { lat, lng }
        this.mapId = 'listings-map';
    }

    async init() {
        window.SearchControllerInstance = this;
        // Initialize Map in Dark Mode
        await mapsService.initMap(this.mapId);

        // Bind Autocomplete
        this.initAutocomplete();

        // Bind GPS "Near Me" trigger
        this.initGeolocation();

        // Bind Simulator Widget
        this.initSimulator();

        // Bind Saved Searches
        this.initSavedSearches();

        // Load Approved properties
        await this.loadProperties();

        // Bind filters
        this.bindFilterListeners();

        // Bind Autocomplete Suggestions Dropdown
        this.initAutocompleteSuggestions();

        // Bind Mobile Filters bottom-sheet buttons
        this.initMobileFiltersToggle();

        // Automatically request geolocation permission on launch
        this.requestInitialGeolocation();
    }

    requestInitialGeolocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    this.userLocation = { lat, lng };
                    mapsService.setUserLocation(this.mapId, lat, lng);
                    
                    const btn = document.getElementById('gps-near-me-btn');
                    if (btn) {
                        btn.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Active`;
                        btn.classList.add('active');
                    }
                    
                    this.filterAndRender();
                },
                (err) => {
                    console.log("Initial geolocation request denied/failed:", err);
                }
            );
        }
    }

    initMobileFiltersToggle() {
        const trigger = document.getElementById('mobile-filter-trigger');
        const closeBtn = document.getElementById('mobile-filter-close');
        const drawer = document.querySelector('.filters-glass-box');
        const backdrop = document.getElementById('crud-backdrop') || document.querySelector('.drawer-backdrop');

        if (!trigger || !drawer) return;

        const openFilters = () => {
            drawer.classList.add('active');
            if (backdrop) backdrop.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        };

        const closeFilters = () => {
            drawer.classList.remove('active');
            if (backdrop) backdrop.classList.remove('active');
            document.body.style.overflow = ''; // Restore background scrolling
        };

        trigger.addEventListener('click', openFilters);
        if (closeBtn) closeBtn.addEventListener('click', closeFilters);
        if (backdrop) backdrop.addEventListener('click', closeFilters);

        // Support Swipe-to-close gesture on filters drawer bottom sheet
        let touchStartY = 0;
        drawer.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        drawer.addEventListener('touchmove', (e) => {
            const touchMoveY = e.touches[0].clientY;
            const diffY = touchMoveY - touchStartY;
            // If swiping down from top of the sheet
            if (diffY > 150 && drawer.scrollTop <= 0) {
                closeFilters();
            }
        }, { passive: true });
    }

    async loadProperties() {
        try {
            this.properties = await propertyService.getApprovedProperties();
            
            // If empty, fetch from database service (which seeds local properties)
            if (this.properties.length === 0) {
                // Wait for seed synchronization
                const all = await propertyService.propertyRepo.getAll();
                this.properties = all.filter(p => p.moderationStatus === 'Approved');
            }

            this.filterAndRender();
        } catch (error) {
            console.error("Error loading properties in search grid:", error);
        }
    }

    bindFilterListeners() {
        const inputs = [
            'keyword-search-input',
            'filter-city-select',
            'filter-type-select',
            'filter-beds-select',
            'filter-status-select',
            'filter-radius-select',
            'sort-selector'
        ];

        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => this.filterAndRender());
                el.addEventListener('input', () => this.filterAndRender());
            }
        });

        // Price Slider
        const slider = document.getElementById('price-range-slider');
        const label = document.getElementById('price-slider-label');
        if (slider && label) {
            slider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                label.textContent = formatPrice(val);
                this.filterAndRender();
            });
        }

        // Amenities
        document.querySelectorAll('.amenity-checkbox').forEach(chk => {
            chk.addEventListener('change', () => this.filterAndRender());
        });
    }

    initAutocomplete() {
        const input = document.getElementById('location-autocomplete-input');
        if (!input) return;

        mapsService.loadGoogleMaps().then(maps => {
            const autocomplete = new maps.places.Autocomplete(input, {
                types: ['(cities)']
            });

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (!place.geometry || !place.geometry.location) return;

                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                
                this.userLocation = { lat, lng };
                mapsService.setUserLocation(this.mapId, lat, lng);
                searchService.saveSearchQuery(input.value);

                this.filterAndRender();
            });
        });
    }

    initAutocompleteSuggestions() {
        const input = document.getElementById('keyword-search-input');
        if (!input) return;

        const wrapper = input.closest('.search-field-wrapper');
        if (wrapper) wrapper.style.position = 'relative';

        // Inject custom suggestions stylesheet if not exists
        if (!document.getElementById('suggestions-custom-styles')) {
            const sheet = document.createElement('style');
            sheet.id = 'suggestions-custom-styles';
            sheet.innerHTML = `
                .search-suggestions-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    width: 100%;
                    background: #11151F;
                    border: 1px solid rgba(201, 169, 110, 0.2);
                    border-radius: 4px;
                    z-index: 1010;
                    max-height: 200px;
                    overflow-y: auto;
                }
                .suggestion-item {
                    padding: 0.6rem 1rem;
                    cursor: pointer;
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.7);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .suggestion-item:hover {
                    background: rgba(201, 169, 110, 0.1);
                    color: #FFF;
                }
                .suggestion-type {
                    font-size: 0.6rem;
                    background: #C9A96E;
                    color: #000;
                    padding: 1px 4px;
                    border-radius: 2px;
                    text-transform: uppercase;
                }
            `;
            document.head.appendChild(sheet);
        }

        // Create suggestions container
        const dropdown = document.createElement('div');
        dropdown.className = 'search-suggestions-dropdown';
        dropdown.style.display = 'none';
        wrapper.appendChild(dropdown);

        // Hide dropdown on click outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        input.addEventListener('input', () => {
            const val = input.value.trim().toLowerCase();
            if (!val) {
                dropdown.style.display = 'none';
                return;
            }

            const suggestions = [];
            const seen = new Set();

            this.properties.forEach(p => {
                if (p.title.toLowerCase().includes(val) && !seen.has(`p:${p.title}`)) {
                    suggestions.push({ text: p.title, type: 'project', value: p.title });
                    seen.add(`p:${p.title}`);
                }
                if (p.city.toLowerCase().includes(val) && !seen.has(`c:${p.city}`)) {
                    suggestions.push({ text: p.city, type: 'city', value: p.city });
                    seen.add(`c:${p.city}`);
                }
                if (p.locality.toLowerCase().includes(val) && !seen.has(`l:${p.locality}`)) {
                    suggestions.push({ text: p.locality, type: 'locality', value: p.locality });
                    seen.add(`l:${p.locality}`);
                }
                if (p.builderId && p.builderId.toLowerCase().includes(val) && !seen.has(`b:${p.builderId}`)) {
                    const bName = p.builderId.toUpperCase();
                    suggestions.push({ text: bName, type: 'builder', value: p.builderId });
                    seen.add(`b:${p.builderId}`);
                }
            });

            if (suggestions.length === 0) {
                dropdown.style.display = 'none';
                return;
            }

            dropdown.innerHTML = suggestions.slice(0, 6).map(s => `
                <div class="suggestion-item" data-val="${s.value}">
                    <span>${s.text}</span>
                    <span class="suggestion-type">${s.type}</span>
                </div>
            `).join('');

            dropdown.style.display = 'block';

            dropdown.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    input.value = item.getAttribute('data-val');
                    dropdown.style.display = 'none';
                    this.filterAndRender();
                });
            });
        });
    }

    initGeolocation() {
        const btn = document.getElementById('gps-near-me-btn');
        if (!btn) return;

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Locating...`;

            if (!navigator.geolocation) {
                btn.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Near Me`;
                eventBus.emit('notification.created', { title: 'GPS Error', message: 'Geolocation is not supported by your browser.' });
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    this.userLocation = { lat, lng };
                    
                    mapsService.setUserLocation(this.mapId, lat, lng);
                    btn.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Active`;
                    btn.classList.add('active');
                    
                    this.filterAndRender();
                },
                (err) => {
                    btn.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Near Me`;
                    let msg = "Unable to retrieve your location coordinates.";
                    if (err.code === err.PERMISSION_DENIED) {
                        msg = "GPS access permission was denied by the user.";
                    }
                    eventBus.emit('notification.created', { title: 'GPS Permission Denied', message: msg });
                },
                { timeout: 7000 }
            );
        });
    }

    initSimulator() {
        // Location simulation select binding
        const select = document.getElementById('location-simulator-presets');
        if (!select) return;

        select.addEventListener('change', (e) => {
            const val = e.target.value;
            if (!val) {
                this.userLocation = null;
                const state = mapsService.activeMaps[this.mapId];
                if (state && state.userMarker) {
                    state.userMarker.setMap(null);
                    state.userMarker = null;
                }
                this.filterAndRender();
                return;
            }

            const [latStr, lngStr] = val.split(',');
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);

            this.userLocation = { lat, lng };
            mapsService.setUserLocation(this.mapId, lat, lng);
            this.filterAndRender();
        });
    }

    initSavedSearches() {
        const btn = document.getElementById('save-search-config-btn');
        if (!btn) return;

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const name = prompt("Name this search configuration:", `Search at ${new Date().toLocaleDateString()}`);
            if (!name) return;

            const filters = {
                keyword: document.getElementById('keyword-search-input')?.value || '',
                city: document.getElementById('filter-city-select')?.value || '',
                type: document.getElementById('filter-type-select')?.value || '',
                beds: document.getElementById('filter-beds-select')?.value || '',
                status: document.getElementById('filter-status-select')?.value || '',
                maxPrice: document.getElementById('price-range-slider')?.value || '20000000',
            };

            searchService.saveUserSearchConfiguration(name, filters);
            eventBus.emit('wishlist.updated'); // Re-draw saved searches
        });
    }

    filterAndRender() {
        const keyword = document.getElementById('keyword-search-input')?.value || '';
        const city = document.getElementById('filter-city-select')?.value || '';
        const type = document.getElementById('filter-type-select')?.value || '';
        const maxPrice = document.getElementById('price-range-slider') ? parseInt(document.getElementById('price-range-slider').value) : 1000000000;
        const beds = document.getElementById('filter-beds-select')?.value ? parseInt(document.getElementById('filter-beds-select').value) : 0;
        const status = document.getElementById('filter-status-select')?.value || '';
        const radius = document.getElementById('filter-radius-select')?.value ? parseFloat(document.getElementById('filter-radius-select').value) : 0;
        const sort = document.getElementById('sort-selector')?.value || 'recent';

        const selectedAmenities = [];
        document.querySelectorAll('.amenity-checkbox:checked').forEach(chk => {
            selectedAmenities.push(chk.value);
        });

        // Calculate Proximities first, so radius filters can operate
        if (this.userLocation) {
            this.properties.forEach(prop => {
                if (prop.coordinates) {
                    prop.distance = calculateDistance(
                        this.userLocation.lat,
                        this.userLocation.lng,
                        prop.coordinates[0],
                        prop.coordinates[1]
                    );
                }
            });
        } else {
            this.properties.forEach(prop => delete prop.distance);
        }

        // Filter
        this.filteredProperties = this.properties.filter(prop => {
            const matchesKeyword = searchService.fuzzyMatch(prop.title, keyword) ||
                                   searchService.fuzzyMatch(prop.description, keyword) ||
                                   searchService.fuzzyMatch(prop.locality, keyword) ||
                                   searchService.fuzzyMatch(prop.city, keyword);
            const matchesCity = !city || prop.city === city;
            const matchesType = !type || prop.propertyType === type;
            const matchesPrice = (prop.price || prop.rentPrice) <= maxPrice;
            const matchesBeds = !beds || prop.bhk >= beds;
            const matchesStatus = !status || prop.status === status;
            const matchesAmenities = selectedAmenities.every(amenity => 
                prop.amenities && prop.amenities.includes(amenity)
            );
            const matchesRadius = !radius || (prop.distance !== undefined && prop.distance <= radius);

            return matchesKeyword && matchesCity && matchesType && matchesPrice && matchesBeds && matchesStatus && matchesAmenities && matchesRadius;
        });

        // Sort
        if (this.userLocation) {
            // Force sort by proximity if GPS is active
            this.filteredProperties.sort((a, b) => (a.distance || 99999) - (b.distance || 99999));
        } else {
            if (sort === 'price-low') {
                this.filteredProperties.sort((a, b) => (a.price || a.rentPrice) - (b.price || b.rentPrice));
            } else if (sort === 'price-high') {
                this.filteredProperties.sort((a, b) => (b.price || b.rentPrice) - (a.price || a.rentPrice));
            } else if (sort === 'luxury') {
                this.filteredProperties.sort((a, b) => b.luxuryScore - a.luxuryScore);
            } else if (sort === 'area') {
                this.filteredProperties.sort((a, b) => b.area - a.area);
            } else {
                this.filteredProperties.sort((a, b) => b.id.localeCompare(a.id));
            }
        }

        // Render counts
        const countLabel = document.getElementById('results-count-label');
        if (countLabel) countLabel.textContent = this.filteredProperties.length;

        // Render Grids
        this.renderGrid(this.filteredProperties);

        // Update Map Markers
        mapsService.plotMarkers(this.mapId, this.filteredProperties);
    }

    renderGrid(list) {
        const grid = document.getElementById('showroom-grid');
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
            const formattedPrice = formatPrice(item.price || item.rentPrice, item.status);

            // Verification Badges UI
            let badgesHtml = '';
            if (item.verified) {
                badgesHtml += `<span class="card-tag" style="background:#10B981; color:#FFF; font-size:0.65rem;"><i class="fa-solid fa-circle-check"></i> Verified</span>`;
            }
            if (item.reraNumber) {
                badgesHtml += `<span class="card-tag" style="background:#C9A96E; color:#FFF; font-size:0.65rem;"><i class="fa-solid fa-shield"></i> RERA</span>`;
            }

            // Distance labels
            let distanceHtml = '';
            if (item.distance !== undefined) {
                const distanceText = formatDistance(item.distance);
                distanceHtml = `<span class="card-tag" style="background:#10B981; color:#FFF;"><i class="fa-solid fa-location-crosshairs"></i> ${distanceText}</span>`;
            }

            // Proximity details row
            const metro = item.nearby?.metro?.[0];
            const school = item.nearby?.school?.[0];
            const hospital = item.nearby?.hospital?.[0];

            let proximityRow = '';
            if (metro || school || hospital || item.distance !== undefined) {
                proximityRow = `
                    <div class="card-specs" style="border-top:1px solid var(--glass-border); padding-top:0.5rem; margin-top:0.5rem; flex-direction:column; align-items:flex-start; gap:0.25rem; font-size:0.7rem; color:var(--text-secondary);">
                        ${item.distance !== undefined ? `<div style="color:#10B981; font-weight: 500;"><i class="fa-solid fa-location-crosshairs"></i> ${formatDistance(item.distance)} (${formatDuration(item.distance)})</div>` : ''}
                        ${metro ? `<div><i class="fa-solid fa-train-subway"></i> Metro: ${metro.name} (${metro.distance})</div>` : ''}
                        ${school ? `<div><i class="fa-solid fa-graduation-cap"></i> School: ${school.name} (${school.distance})</div>` : ''}
                        ${hospital ? `<div><i class="fa-solid fa-hospital"></i> Medical: ${hospital.name} (${hospital.distance})</div>` : ''}
                    </div>
                `;
            }

            html += `
                <div class="property-card" data-id="${item.id}" style="opacity: 0; transform: translateY(20px); animation: fadeInUp 0.4s ease forwards;">
                    <div class="card-image-wrapper">
                        <img src="${item.images[0]}" alt="${item.title}" class="card-image" loading="lazy">
                        <div class="card-overlay"></div>
                        <div class="card-tags">
                            <span class="card-tag">${item.status}</span>
                            <span class="card-tag" style="background:#0F172A; color:#FFF;">${item.propertyType}</span>
                            ${badgesHtml}
                            ${distanceHtml}
                        </div>
                        <button class="card-wishlist-btn" data-id="${item.id}" aria-label="Add to saved list">
                            <i class="fa-solid fa-heart"></i>
                        </button>
                        
                        <label class="card-compare-chk" data-id="${item.id}">
                            <input type="checkbox" class="compare-chkbox" data-id="${item.id}">
                            <span>Compare</span>
                        </label>
                        
                        <div class="card-details-panel glass-panel">
                            <div class="card-location"><i class="fa-solid fa-location-dot"></i> ${item.locality}, ${item.city}</div>
                            <h3 class="card-title">${item.title}</h3>
                            <div class="card-specs">
                                <span><i class="fa-solid fa-bed"></i> ${item.bhk || 'N/A'} BHK</span>
                                <span><i class="fa-solid fa-ruler-combined"></i> ${formatArea(item.area)}</span>
                                ${item.plotSize > 0 ? `<span><i class="fa-solid fa-tree"></i> ${formatPlot(item.plotSize)}</span>` : ''}
                            </div>
                            ${proximityRow}
                            <div class="card-footer" style="margin-top:0.5rem;">
                                <span class="card-price">${formattedPrice}</span>
                                <a href="property.html?id=${item.id}" class="card-link">View Details <i class="fa-solid fa-arrow-right"></i></a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;

        // Bind animations and triggers
        grid.querySelectorAll('.property-card').forEach((card, idx) => {
            card.style.animationDelay = `${idx * 0.05}s`;
            
            // Hover pan map
            card.addEventListener('mouseenter', () => {
                const target = list.find(item => item.id === card.getAttribute('data-id'));
                if (target && target.coordinates) {
                    const state = mapsService.activeMaps[this.mapId];
                    if (state && state.map) {
                        state.map.panTo({ lat: target.coordinates[0], lng: target.coordinates[1] });
                        state.map.setZoom(12);
                    }
                }
            });

            // Track details click
            card.querySelector('.card-link')?.addEventListener('click', () => {
                analyticsService.trackAction(card.getAttribute('data-id'), 'views');
            });
        });

        // Trigger globally exported wishlist/comparison updates
        if (window.updateWishlistUI) window.updateWishlistUI();
        if (window.updateCompareSlots) window.updateCompareSlots();
    }
}
