/* js/controllers/DetailsController.js - UI controller for property details pages */

import { propertyService } from '../services/property/propertyService.js';
import { analyticsService } from '../services/analytics/analyticsService.js';
import { mapsService } from '../services/maps/mapsService.js';
import { seoService } from '../services/seo/seoService.js';
import { bookingService } from '../services/booking/bookingService.js';
import { showToast } from '../app.js';
import { eventBus } from '../core/eventBus.js';
import { formatPrice, formatArea, formatPlot } from '../utils/formatters.js';

export class DetailsController {
    constructor() {
        this.propertyId = null;
        this.property = null;
        this.mapId = 'detail-map';
        this.mapInstance = null;
        this.startTime = Date.now();
        this.poiMarkers = [];
        this.poiLines = [];
        this.mortgageChartInstance = null;
    }

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.propertyId = urlParams.get('id') || 'prop-1'; // Default fallback

        try {
            // Load property data
            this.property = await propertyService.getPropertyById(this.propertyId);
            if (!this.property) {
                this.property = await propertyService.propertyRepo.findById(this.propertyId);
            }

            if (!this.property) {
                this.renderErrorScreen("Luxury Residence not found in LuxeHaven portfolios.");
                return;
            }

            // 1. Populate UI Fields
            this.populatePropertyData(this.property);

            // 2. Load Agent Info
            await this.loadAgentData(this.property.agentId);

            // 3. Pannellum 360 Virtual Tour
            this.initPannellumViewer(this.property.panoramaUrl);

            // 4. Floor plan Canvas drawing
            this.drawFloorPlanBlueprint();

            // 5. Mortgage Calculator (ChartJS)
            this.initMortgageCalculator(this.property.price);

            // 6. Similar Properties
            await this.loadSimilarProperties();

            // 7. Save Toggles (Wishlist)
            this.initSaveButton(this.propertyId);

            // 8. Track Analytics
            this.initAnalyticsTracking();

            // 9. Inject SEO Meta tags
            this.injectSEOHeaders();

            // 10. Proximity Map
            await this.initProximityMap();

            // 11. Booking scheduler Form
            this.bindBookingForm();

        } catch (error) {
            console.error("Error loading property detail view:", error);
            this.renderErrorScreen("Platform configuration error.");
        }
    }

    renderErrorScreen(message) {
        const detailContainer = document.querySelector('.property-detail-wrapper') || document.body;
        detailContainer.innerHTML = `
            <div style="text-align:center; padding:10rem 2rem; color:var(--text-secondary); background:var(--bg-primary); min-height:100vh;">
                <i class="fa-solid fa-hotel" style="font-size:4rem; color:var(--accent-gold); margin-bottom:2rem; animation: pulse 2s infinite;"></i>
                <h2 style="font-family:var(--font-heading); text-transform:uppercase; color:#FFF; margin-bottom:1rem;">Portfolio Lock</h2>
                <p style="font-size:0.95rem; line-height:1.6; max-width:400px; margin:0 auto; margin-bottom:2rem;">${message}</p>
                <a href="properties.html" class="btn-primary" style="display:inline-flex; justify-content:center; padding:0.75rem 2rem; margin:0 auto;">Back to showroom</a>
            </div>
        `;
    }

    populatePropertyData(prop) {
        const titleEl = document.getElementById('detail-title');
        const breadcrumbsEl = document.getElementById('detail-breadcrumbs');
        const descEl = document.getElementById('detail-desc');
        const priceEl = document.getElementById('detail-price');
        const areaEl = document.getElementById('detail-area');
        const plotEl = document.getElementById('detail-plot');
        const bedsEl = document.getElementById('detail-bedrooms');
        const bathsEl = document.getElementById('detail-bathrooms');
        const roiEl = document.getElementById('detail-roi');

        if (titleEl) titleEl.textContent = prop.title;
        if (breadcrumbsEl) breadcrumbsEl.textContent = `${prop.city} | ${prop.locality || prop.location || ''}`;
        if (descEl) descEl.textContent = prop.description;
        
        const formattedPrice = formatPrice(prop.price || prop.rentPrice, prop.status);

        if (priceEl) priceEl.textContent = formattedPrice;
        if (areaEl) areaEl.textContent = formatArea(prop.area);
        if (plotEl) plotEl.textContent = prop.plotSize > 0 ? formatPlot(prop.plotSize) : 'N/A';
        if (bedsEl) bedsEl.textContent = prop.bhk ? `${prop.bhk} BHK` : 'N/A';
        if (bathsEl) bathsEl.textContent = prop.reraNumber || 'N/A';
        if (roiEl) roiEl.textContent = prop.roi > 0 ? `${prop.roi}%` : 'N/A';

        // AI Scores mapping
        if (document.getElementById('detail-ai-investment')) {
            document.getElementById('detail-ai-investment').textContent = prop.investmentScore ? `${prop.investmentScore}/10` : 'N/A';
        }
        if (document.getElementById('detail-ai-connectivity')) {
            document.getElementById('detail-ai-connectivity').textContent = prop.connectivityScore ? `${prop.connectivityScore}/10` : 'N/A';
        }
        if (document.getElementById('detail-ai-lifestyle')) {
            document.getElementById('detail-ai-lifestyle').textContent = prop.lifestyleScore ? `${prop.lifestyleScore}/10` : 'N/A';
        }
        if (document.getElementById('detail-ai-appreciation')) {
            document.getElementById('detail-ai-appreciation').textContent = prop.roi ? `${prop.roi}%` : 'N/A';
        }

        const mainImg = document.getElementById('detail-main-img');
        if (mainImg && prop.images && prop.images.length > 0) {
            mainImg.src = prop.images[0];
        }
    }

    async loadAgentData(agentId) {
        try {
            const res = await fetch('../data/agents.json');
            if (res.ok) {
                const agents = await res.json();
                const agent = agents.find(a => a.id === agentId) || agents[0];
                
                const portrait = document.getElementById('agent-portrait');
                const name = document.getElementById('agent-name');
                const role = document.getElementById('agent-role');

                if (portrait) portrait.src = agent.image;
                if (name) name.textContent = agent.name;
                if (role) role.textContent = agent.role;
                
                const waBtn = document.querySelector('.booking-form a');
                if (waBtn) {
                    const formattedPhone = agent.phone.replace(/[^0-9]/g, '');
                    waBtn.setAttribute('href', `https://wa.me/${formattedPhone}?text=Hello%20${encodeURIComponent(agent.name)},%20I%20am%20interested%20in%20arranging%20a%20viewing.`);
                }
            }
        } catch (e) {
            console.warn("Unable to load curator agent profiles data:", e);
        }
    }

    initPannellumViewer(panoramaUrl) {
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

    drawFloorPlanBlueprint() {
        const canvas = document.getElementById('floorplan-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        canvas.width = w;
        canvas.height = h;

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

        ctx.strokeStyle = 'rgba(201, 169, 110, 0.5)'; // Accent Gold
        ctx.lineWidth = 1.5;

        const lines = [
            { x1: 50, y1: 50, x2: w - 50, y2: 50 },
            { x1: w - 50, y1: 50, x2: w - 50, y2: h - 50 },
            { x1: w - 50, y1: h - 50, x2: 50, y2: h - 50 },
            { x1: 50, y1: h - 50, x2: 50, y2: 50 },
            { x1: w * 0.45, y1: 50, x2: w * 0.45, y2: h - 50 },
            { x1: 50, y1: h * 0.5, x2: w * 0.45, y2: h * 0.5 },
            { x1: w * 0.45, y1: h * 0.6, x2: w - 50, y2: h * 0.6 }
        ];

        let currentIdx = 0;
        let progress = 0;

        const renderStep = () => {
            if (currentIdx >= lines.length) {
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = '9px sans-serif';
                ctx.fillText('MASTER SUITE', 70, 90);
                ctx.fillText('LIVING RETREAT', 70, 200);
                ctx.fillText('OUTDOOR DECK', w * 0.6, 120);
                ctx.fillText('ITALIAN CHEF KITCHEN', w * 0.6, 230);
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
        };
        renderStep();
    }

    initMortgageCalculator(propPrice) {
        // Guard if property is for Rent
        if (this.property && this.property.status === 'Rent') {
            const calculatorWrapper = document.querySelector('.mortgage-calculator-box');
            if (calculatorWrapper) {
                calculatorWrapper.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 2rem 10px; color: var(--text-secondary);">
                        <i class="fa-solid fa-calculator" style="font-size: 2.5rem; color: var(--accent-gold); margin-bottom: 1rem;"></i>
                        <p>Mortgage estimations are not applicable for rental properties.</p>
                    </div>
                `;
            }
            return;
        }

        const calcPrice = document.getElementById('calc-price-input');
        const calcDown = document.getElementById('calc-down-input');
        const calcInterest = document.getElementById('calc-interest-input');
        const calcTerm = document.getElementById('calc-term-input');
        const emiLabel = document.getElementById('mortgage-emi-value');

        if (!calcPrice || !calcDown || !calcInterest || !calcTerm || !emiLabel) return;

        calcPrice.value = propPrice;
        calcDown.value = Math.floor(propPrice * 0.20); // 20% downpayment
        calcInterest.value = 8.5; // Default Indian interest rate
        calcTerm.value = 20; // Default term in years

        const runCalculations = () => {
            const price = parseInt(calcPrice.value) || 0;
            const down = parseInt(calcDown.value) || 0;
            const annualRate = parseFloat(calcInterest.value) || 8.5;
            const years = parseInt(calcTerm.value) || 20;

            const loanAmount = price - down;
            if (loanAmount <= 0) {
                emiLabel.textContent = '₹0';
                this.updateMortgageChart(0, 0);
                return;
            }

            const monthlyRate = annualRate / 12 / 100;
            const monthsCount = years * 12;

            let monthlyPayment = 0;
            if (monthlyRate === 0) {
                monthlyPayment = loanAmount / monthsCount;
            } else {
                monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, monthsCount)) / 
                                 (Math.pow(1 + monthlyRate, monthsCount) - 1);
            }

            emiLabel.textContent = `₹${Math.floor(monthlyPayment).toLocaleString('en-IN')}/mo`;

            const totalPayments = monthlyPayment * monthsCount;
            const totalInterest = totalPayments - loanAmount;

            this.updateMortgageChart(loanAmount, totalInterest);
        };

        calcDown.addEventListener('input', runCalculations);
        calcInterest.addEventListener('input', runCalculations);
        calcTerm.addEventListener('change', runCalculations);

        runCalculations();
    }

    updateMortgageChart(principal, interest) {
        const ctx = document.getElementById('mortgage-chart');
        if (!ctx || typeof Chart === 'undefined') return;

        if (this.mortgageChartInstance) {
            this.mortgageChartInstance.destroy();
        }

        this.mortgageChartInstance = new Chart(ctx, {
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

    async loadSimilarProperties() {
        const container = document.getElementById('similar-grid');
        if (!container) return;

        try {
            const list = await propertyService.getApprovedProperties();
            const similar = list
                .filter(p => p.propertyType === this.property.propertyType && p.id !== this.property.id)
                .slice(0, 2);

            if (similar.length === 0) {
                container.innerHTML = `<p style="font-size:0.9rem; color:var(--text-secondary); grid-column:1/-1;">No similar residences available currently.</p>`;
                return;
            }

            let html = '';
            similar.forEach(item => {
                const formattedPrice = formatPrice(item.price || item.rentPrice, item.status);

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
        } catch (e) {
            console.error("Failed loading similar properties:", e);
        }
    }

    initSaveButton(propId) {
        const saveBtn = document.getElementById('detail-save-btn');
        if (!saveBtn) return;

        const updateBtnStyle = () => {
            const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
            if (wishlist.includes(propId)) {
                saveBtn.innerHTML = `<i class="fa-solid fa-heart" style="color:#EF4444;"></i> Saved`;
                saveBtn.className = 'btn-primary magnetic';
            } else {
                saveBtn.innerHTML = `<i class="fa-regular fa-heart"></i> Save`;
                saveBtn.className = 'btn-secondary magnetic';
            }
        };

        updateBtnStyle();

        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
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
            eventBus.emit('wishlist.updated');
        });
    }

    initAnalyticsTracking() {
        analyticsService.trackPageView(this.propertyId);

        window.addEventListener('beforeunload', () => {
            const durationSeconds = Math.round((Date.now() - this.startTime) / 1000);
            analyticsService.trackTimeOnPage(this.propertyId, durationSeconds);
        });

        // Track image clicks
        document.querySelectorAll('.swiper-slide img')?.forEach(img => {
            img.addEventListener('click', () => {
                analyticsService.trackAction(this.propertyId, 'galleryViews');
            });
        });

        // Track wishlist action
        document.getElementById('detail-save-btn')?.addEventListener('click', () => {
            analyticsService.trackAction(this.propertyId, 'wishlistAdds');
        });
    }

    injectSEOHeaders() {
        const seoData = seoService.automatePropertySEO(this.property);
        document.title = seoData.metaTags.title;

        const head = document.head;
        head.querySelectorAll('.dynamic-seo-tag').forEach(t => t.remove());

        // Canonical
        const canonical = document.createElement('link');
        canonical.rel = 'canonical';
        canonical.href = seoData.metaTags.canonical;
        canonical.className = 'dynamic-seo-tag';
        head.appendChild(canonical);

        // Meta tags
        seoData.metaTags.meta.forEach(m => {
            const meta = document.createElement('meta');
            Object.entries(m).forEach(([k, v]) => meta.setAttribute(k, v));
            meta.className = 'dynamic-seo-tag';
            head.appendChild(meta);
        });

        // JSON-LD schema
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(seoData.jsonLd);
        script.className = 'dynamic-seo-tag';
        head.appendChild(script);
    }

    async initProximityMap() {
        const container = document.getElementById(this.mapId);
        if (!container || !this.property.coordinates) return;

        const propLat = this.property.coordinates[0];
        const propLng = this.property.coordinates[1];

        try {
            this.mapInstance = await mapsService.initMap(this.mapId, { lat: propLat, lng: propLng }, 14);
            if (!this.mapInstance) return;

            mapsService.loadGoogleMaps().then(maps => {
                // Main House pin
                const marker = new maps.Marker({
                    position: { lat: propLat, lng: propLng },
                    map: this.mapInstance,
                    title: this.property.title,
                    icon: {
                        path: maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                        scale: 8,
                        fillColor: "#C9A96E", // Gold pin glow
                        fillOpacity: 0.9,
                        strokeColor: "#FFFFFF",
                        strokeWeight: 2
                    }
                });

                const infoWindow = new maps.InfoWindow({
                    content: `<div style="color:#000; font-family:sans-serif; padding:0.25rem;"><strong>${this.property.title}</strong><br>${this.property.location}</div>`
                });

                marker.addListener('click', () => {
                    infoWindow.open(this.mapInstance, marker);
                });

                const tabs = document.querySelectorAll('[data-poi]');
                tabs.forEach(tab => {
                    tab.addEventListener('click', (e) => {
                        e.preventDefault();
                        tabs.forEach(t => t.classList.remove('active'));
                        tab.classList.add('active');
                        this.renderPOIs(tab.getAttribute('data-poi'));
                    });
                });

                // Default load metro POIs
                this.renderPOIs('metro');
            });
        } catch (e) {
            console.error("Proximity map failed to initialize:", e);
        }
    }

    renderPOIs(poiType) {
        if (!this.mapInstance || !window.google || !google.maps) return;

        // Clear markers & lines
        this.poiMarkers.forEach(m => m.setMap(null));
        this.poiMarkers = [];
        this.poiLines.forEach(l => l.setMap(null));
        this.poiLines = [];

        const container = document.getElementById('proximity-places-container');
        if (!container) return;

        const list = this.property.nearby?.[poiType] || [];
        if (list.length === 0) {
            container.innerHTML = `<p style="font-size:0.9rem; color:var(--text-secondary);">No nearby places registered in this category.</p>`;
            return;
        }

        const offsets = [
            [0.003, 0.004],
            [-0.004, -0.002],
            [0.001, -0.005],
            [-0.002, 0.006]
        ];

        const propLat = this.property.coordinates[0];
        const propLng = this.property.coordinates[1];
        let html = '';

        list.forEach((place, idx) => {
            const offset = offsets[idx % offsets.length];
            const placeLat = propLat + offset[0];
            const placeLng = propLng + offset[1];

            const marker = new google.maps.Marker({
                position: { lat: placeLat, lng: placeLng },
                map: this.mapInstance,
                title: place.name,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 5,
                    fillColor: "#FFFFFF",
                    fillOpacity: 1.0,
                    strokeColor: "#C9A96E",
                    strokeWeight: 2
                }
            });

            const infoWindow = new google.maps.InfoWindow({
                content: `<div style="color:#000; font-family:sans-serif; padding:0.25rem;"><strong>${place.name}</strong><br>Proximity: ${place.distance}</div>`
            });

            marker.addListener('mouseover', () => infoWindow.open(this.mapInstance, marker));
            this.poiMarkers.push(marker);

            const polyline = new google.maps.Polyline({
                path: [
                    { lat: propLat, lng: propLng },
                    { lat: placeLat, lng: placeLng }
                ],
                strokeColor: '#C9A96E',
                strokeOpacity: 0,
                icons: [{
                    icon: {
                        path: 'M 0,-1 0,1',
                        strokeOpacity: 0.8,
                        strokeColor: '#C9A96E',
                        scale: 2
                    },
                    offset: '0',
                    repeat: '10px'
                }],
                map: this.mapInstance
            });

            this.poiLines.push(polyline);

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

    bindBookingForm() {
        const form = document.getElementById('viewing-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Booking...`;

            const payload = {
                propertyId: this.propertyId,
                propertyTitle: this.property.title,
                name: document.getElementById('viewing-name').value.trim(),
                email: document.getElementById('viewing-email').value.trim(),
                phone: document.getElementById('viewing-phone').value.trim(),
                date: document.getElementById('viewing-date').value,
                message: document.getElementById('viewing-message').value.trim()
            };

            try {
                await bookingService.createBooking(payload);
                await analyticsService.trackAction(this.propertyId, 'bookingClicks');
                
                showToast("Viewing appointment booked successfully!", "success");
                form.reset();
            } catch (err) {
                showToast(err.message, "error");
            } finally {
                if (submitBtn) submitBtn.innerHTML = `Book Private Viewing <i class="fa-solid fa-calendar-days"></i>`;
            }
        });
    }
}
export default DetailsController;
