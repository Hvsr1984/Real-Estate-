/* js/property.js - Showroom Detailed View Engine */

import { showToast } from './app.js';
import { trackRecentlyViewed } from './wishlist.js';

let mortgageChartInstance = null;
let detailMapInstance = null;
let detailMarkerLayerGroup = null;

document.addEventListener('DOMContentLoaded', () => {
    initPropertyDetailsPage();
});

function initPropertyDetailsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    let propId = urlParams.get('id');
    
    if (!propId) {
        // Fallback to first property if no ID in URL
        propId = 'prop-1';
    }

    // Load Database properties
    fetch('../data/properties.json')
        .then(res => res.json())
        .then(seedData => {
            const cmsDb = JSON.parse(localStorage.getItem('properties_db')) || [];
            const combined = [...seedData, ...cmsDb];
            
            const property = combined.find(p => p.id === propId);
            if (!property) {
                window.location.href = 'properties.html';
                return;
            }

            // Track Recently Viewed
            trackRecentlyViewed(property.id);

            // Populate DOM Fields
            populatePropertyData(property);

            // Load Curator details
            loadAgentData(property.agentId);

            // Init 360 virtual tour (Pannellum)
            initPannellumViewer(property.panoramaUrl);

            // Draw Blueprint CAD layout
            drawFloorPlanBlueprint();

            // Init Proximity Map & POIs (Leaflet)
            initProximityMap(property);

            // Init Mortgage Calculator (Chart.js)
            initMortgageCalculator(property.price);

            // Load Similar Properties Grid
            loadSimilarProperties(combined, property);

            // Hook Form validations
            initViewingForm(property.id);
            
            // Set up save button toggle
            initSaveButton(property.id);
        });
}

/* ==========================================================================
   POPULATE DOM FIELDS
   ========================================================================== */
function populatePropertyData(prop) {
    document.getElementById('detail-title').textContent = prop.title;
    document.getElementById('detail-breadcrumbs').textContent = `${prop.city} | ${prop.location}`;
    document.getElementById('detail-desc').textContent = prop.description;
    
    const formattedPrice = prop.price >= 1000000 
        ? `$${(prop.price / 1000000).toFixed(2)}M` 
        : `$${prop.price.toLocaleString()}${prop.status === 'Rent' ? '/mo' : ''}`;

    document.getElementById('detail-price').textContent = formattedPrice;
    document.getElementById('detail-area').textContent = `${prop.area} M²`;
    document.getElementById('detail-plot').textContent = prop.plotSize > 0 ? `${prop.plotSize} HA` : 'N/A';
    document.getElementById('detail-bedrooms').textContent = prop.bedrooms || 'N/A';
    document.getElementById('detail-bathrooms').textContent = prop.bathrooms || 'N/A';
    document.getElementById('detail-roi').textContent = prop.roi > 0 ? `${prop.roi}%` : 'N/A';

    const mainImg = document.getElementById('detail-main-img');
    if (mainImg && prop.images.length > 0) {
        mainImg.src = prop.images[0];
    }
}

/* ==========================================================================
   LOAD ASSOCIATED AGENT CURATOR
   ========================================================================== */
function loadAgentData(agentId) {
    fetch('../data/agents.json')
        .then(res => res.json())
        .then(agents => {
            const agent = agents.find(a => a.id === agentId) || agents[0];
            
            document.getElementById('agent-portrait').src = agent.image;
            document.getElementById('agent-name').textContent = agent.name;
            document.getElementById('agent-role').textContent = agent.role;
            
            const waBtn = document.querySelector('.booking-form a');
            if (waBtn) {
                const formattedPhone = agent.phone.replace(/[^0-9]/g, '');
                waBtn.setAttribute('href', `https://wa.me/${formattedPhone}?text=Hello%20${encodeURIComponent(agent.name)},%20I%20am%20interested%20in%20arranging%20a%20viewing.`);
            }
        });
}

/* ==========================================================================
   PANNELLUM 360 PANORAMA VIEWER
   ========================================================================== */
function initPannellumViewer(panoramaUrl) {
    if (typeof pannellum === 'undefined' || !document.getElementById('panorama-container')) return;

    pannellum.viewer('panorama-container', {
        type: 'equirectangular',
        panorama: panoramaUrl || 'https://pannellum.org/images/alma.jpg',
        autoLoad: true,
        compass: false,
        showZoomCtrl: false,
        mouseZoom: false
    });
}

/* ==========================================================================
   DRAW BLUEPRINT FLOOR PLAN ON CANVAS
   ========================================================================== */
function drawFloorPlanBlueprint() {
    const canvas = document.getElementById('floorplan-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w;
    canvas.height = h;

    // Draw background graph squares
    ctx.fillStyle = '#05070C';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;

    for (let x = 0; x < w; x += 15) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    for (let y = 0; y < h; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

    // Design layout elements
    ctx.strokeStyle = 'rgba(201, 169, 110, 0.5)'; // Accent Gold
    ctx.lineWidth = 1.5;

    // Animating line drawings
    const lines = [
        { x1: 50, y1: 50, x2: w - 50, y2: 50 },
        { x1: w - 50, y1: 50, x2: w - 50, y2: h - 50 },
        { x1: w - 50, y1: h - 50, x2: 50, y2: h - 50 },
        { x1: 50, y1: h - 50, x2: 50, y2: 50 },
        
        // Rooms
        { x1: w * 0.45, y1: 50, x2: w * 0.45, y2: h - 50 },
        { x1: 50, y1: h * 0.5, x2: w * 0.45, y2: h * 0.5 },
        { x1: w * 0.45, y1: h * 0.6, x2: w - 50, y2: h * 0.6 }
    ];

    let currentIdx = 0;
    let progress = 0;

    function renderStep() {
        if (currentIdx >= lines.length) {
            // Write labels at end of drawing
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '9px var(--font-heading)';
            ctx.fillText('MASTER RESIDENCE', 70, 90);
            ctx.fillText('LIVING ROOM', 70, 200);
            ctx.fillText('POOL ENVELOPE', w * 0.6, 120);
            ctx.fillText('KITCHEN CONSTRUCT', w * 0.6, 230);
            return;
        }

        const line = lines[currentIdx];
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        const cx = line.x1 + (line.x2 - line.x1) * progress;
        const cy = line.y1 + (line.y2 - line.y1) * progress;
        ctx.lineTo(cx, cy);
        ctx.stroke();

        progress += 0.08;
        if (progress >= 1) {
            progress = 0;
            currentIdx++;
        }
        requestAnimationFrame(renderStep);
    }
    renderStep();
}

/* ==========================================================================
   PROXIMITY MAP (LEAFLET)
   ========================================================================== */
function initProximityMap(prop) {
    if (typeof L === 'undefined' || !document.getElementById('detail-map')) return;

    const [lat, lng] = prop.coordinates;

    // Setup Map
    detailMapInstance = L.map('detail-map', {
        zoomControl: false,
        scrollWheelZoom: false
    }).setView([lat, lng], 14);

    // Dark tileset
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
    }).addTo(detailMapInstance);

    detailMarkerLayerGroup = L.layerGroup().addTo(detailMapInstance);

    // Primary property marker
    const homeIcon = L.divIcon({
        className: 'custom-map-home-marker',
        html: `<div style="width: 26px; height: 26px; background-color: #C9A96E; border: 4px solid #05070C; border-radius: 50%; box-shadow: 0 0 15px #C9A96E;"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
    });

    L.marker([lat, lng], { icon: homeIcon })
        .bindPopup(`<strong>${prop.title}</strong><br>${prop.location}`)
        .addTo(detailMapInstance);

    // Dynamic POI Selector Tabs
    const tabs = document.querySelectorAll('[data-poi]');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const poiType = tab.getAttribute('data-poi');
            renderPOIs(prop, poiType);
        });
    });

    // Run initial rendering
    renderPOIs(prop, 'metro');
}

function renderPOIs(prop, poiType) {
    if (!detailMapInstance || !detailMarkerLayerGroup) return;

    // Clear existing overlay layer items
    detailMarkerLayerGroup.clearLayers();

    const container = document.getElementById('proximity-places-container');
    if (!container) return;

    const list = prop.nearby[poiType] || [];
    if (list.length === 0) {
        container.innerHTML = `<p style="font-size:0.9rem; color:var(--text-secondary);">No nearby places registered for this category.</p>`;
        return;
    }

    // Coordinate offset templates (simulating regional locations)
    const offsets = [
        [0.004, 0.005],
        [-0.005, -0.003],
        [0.002, -0.006],
        [-0.003, 0.007]
    ];

    const propLat = prop.coordinates[0];
    const propLng = prop.coordinates[1];
    
    let html = '';

    list.forEach((place, index) => {
        const offset = offsets[index % offsets.length];
        const placeLat = propLat + offset[0];
        const placeLng = propLng + offset[1];

        // Draw pin on Map
        const poiIcon = L.divIcon({
            className: 'custom-poi-marker',
            html: `<div style="width: 16px; height: 16px; background-color: #FFFFFF; border: 3px solid #C9A96E; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        const marker = L.marker([placeLat, placeLng], { icon: poiIcon })
            .bindPopup(`<strong>${place.name}</strong><br>Distance: ${place.distance}`)
            .addTo(detailMarkerLayerGroup);

        // Draw connecting dashed line
        L.polyline([[propLat, propLng], [placeLat, placeLng]], {
            color: '#C9A96E',
            dashArray: '4, 4',
            weight: 1.5
        }).addTo(detailMarkerLayerGroup);

        // Generate list card HTML
        html += `
            <div class="glass-panel proximity-place-card" style="border-radius: var(--border-radius-sm);">
                <div>
                    <h5 style="font-size:0.9rem; font-weight:600; margin-bottom:0.25rem;">${place.name}</h5>
                    <span style="font-size:0.75rem; color:var(--text-secondary);"><i class="fa-solid fa-compass"></i> Proximity Zone</span>
                </div>
                <span class="proximity-badge">${place.distance}</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

/* ==========================================================================
   MORTGAGE calculator
   ========================================================================== */
function initMortgageCalculator(propPrice) {
    const calcPrice = document.getElementById('calc-price-input');
    const calcDown = document.getElementById('calc-down-input');
    const calcInterest = document.getElementById('calc-interest-input');
    const calcTerm = document.getElementById('calc-term-input');
    const emiLabel = document.getElementById('mortgage-emi-value');

    if (!calcPrice || !calcDown || !calcInterest || !calcTerm) return;

    // Initialize values
    calcPrice.value = propPrice;
    
    // Default downpayment is 20%
    const defaultDown = Math.floor(propPrice * 0.20);
    calcDown.value = defaultDown;

    const runCalculations = () => {
        const price = parseInt(calcPrice.value) || 0;
        const down = parseInt(calcDown.value) || 0;
        const annualRate = parseFloat(calcInterest.value) || 4.5;
        const years = parseInt(calcTerm.value) || 30;

        const loanAmount = price - down;
        if (loanAmount <= 0) {
            emiLabel.textContent = '$0';
            updateMortgageChart(0, 0);
            return;
        }

        const monthlyRate = annualRate / 12 / 100;
        const monthsCount = years * 12;

        let monthlyPayment = 0;
        if (monthlyRate === 0) {
            monthlyPayment = loanAmount / monthsCount;
        } else {
            monthlyPayment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, monthsCount) / (Math.pow(1 + monthlyRate, monthsCount) - 1);
        }

        emiLabel.textContent = `$${Math.floor(monthlyPayment).toLocaleString()}/mo`;

        const totalPayments = monthlyPayment * monthsCount;
        const totalInterest = totalPayments - loanAmount;

        // Render dynamic Chart.js chart
        updateMortgageChart(loanAmount, totalInterest);
    };

    // Watchers
    calcDown.addEventListener('input', runCalculations);
    calcInterest.addEventListener('input', runCalculations);
    calcTerm.addEventListener('change', runCalculations);

    runCalculations();
}

function updateMortgageChart(principal, interest) {
    const ctx = document.getElementById('mortgage-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    if (mortgageChartInstance) {
        mortgageChartInstance.destroy();
    }

    mortgageChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal Loan', 'Total Interest'],
            datasets: [{
                data: [principal, interest],
                backgroundColor: ['#C9A96E', '#1E293B'],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '70%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

/* ==========================================================================
   LOAD SIMILAR PROPERTIES
   ========================================================================== */
function loadSimilarProperties(properties, currentProp) {
    const container = document.getElementById('similar-grid');
    if (!container) return;

    // Filter by type, exclude active ID
    const similar = properties
        .filter(p => p.type === currentProp.type && p.id !== currentProp.id)
        .slice(0, 2);

    if (similar.length === 0) {
        container.innerHTML = `<p style="font-size:0.9rem; color:var(--text-secondary); grid-column:1/-1;">No similar residences available currently.</p>`;
        return;
    }

    let html = '';
    similar.forEach(item => {
        const formattedPrice = item.price >= 1000000 
            ? `$${(item.price / 1000000).toFixed(2)}M` 
            : `$${item.price.toLocaleString()}`;

        html += `
            <div class="property-card" style="border-radius: var(--border-radius-md);">
                <div class="card-image-wrapper" style="height: 300px;">
                    <img src="${item.images[0]}" alt="${item.title}" class="card-image" loading="lazy">
                    <div class="card-overlay"></div>
                    <div class="card-details-panel glass-panel" style="padding: 1rem;">
                        <h4 style="color:#FFF; font-size:1.1rem; margin-bottom:0.25rem;">${item.title}</h4>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="color:var(--accent-gold); font-weight:600; font-size:0.95rem;">${formattedPrice}</span>
                            <a href="property.html?id=${item.id}" style="font-size:0.75rem; color:#FFF;">Explore <i class="fa-solid fa-chevron-right"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

/* ==========================================================================
   VIEWING REQUEST FORM Persist
   ========================================================================== */
function initViewingForm(propId) {
    const form = document.getElementById('viewing-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('viewing-name').value.trim();
        const email = document.getElementById('viewing-email').value.trim();
        const phone = document.getElementById('viewing-phone').value.trim();
        const date = document.getElementById('viewing-date').value;
        const msg = document.getElementById('viewing-message').value.trim();

        // Lead object
        const newLead = {
            id: 'lead-' + Date.now(),
            name,
            email,
            phone,
            date,
            message: msg,
            propertyId: propId,
            timestamp: new Date().toLocaleString()
        };

        // Save to leads database in localStorage
        const leads = JSON.parse(localStorage.getItem('leads_db')) || [];
        leads.push(newLead);
        localStorage.setItem('leads_db', JSON.stringify(leads));

        showToast('Viewing request logged successfully! Curator will contact you shortly.', 'success');
        form.reset();
    });
}

/* ==========================================================================
   SAVE BUTTON WISHLIST TOGGLER
   ========================================================================== */
function initSaveButton(propId) {
    const saveBtn = document.getElementById('detail-save-btn');
    if (!saveBtn) return;

    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    
    const updateBtnStyle = () => {
        if (wishlist.includes(propId)) {
            saveBtn.innerHTML = `<i class="fa-solid fa-heart" style="color:#EF4444;"></i> Saved`;
            saveBtn.className = 'btn-primary magnetic';
        } else {
            saveBtn.innerHTML = `<i class="fa-regular fa-heart"></i> Save`;
            saveBtn.className = 'btn-secondary magnetic';
        }
    };
    
    updateBtnStyle();

    saveBtn.addEventListener('click', () => {
        wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        const index = wishlist.indexOf(propId);
        if (index === -1) {
            wishlist.push(propId);
            showToast('Property saved to wishlist', 'success');
        } else {
            wishlist.splice(index, 1);
            showToast('Property removed from wishlist', 'success');
        }
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        updateBtnStyle();
        
        // Sync navbar items
        const badges = document.querySelectorAll('.wishlist-count-badge');
        badges.forEach(badge => badge.textContent = wishlist.length);
    });
}
