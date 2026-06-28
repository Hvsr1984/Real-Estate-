/* js/dashboard.js - CMS Admin Panel Coordinator */

import { showToast } from './app.js';

let dashboardChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

function initDashboard() {
    // 1. Tab Switching Handler
    initTabSwitching();

    // 2. Load Properties and Sync Cache Database
    fetchAndSyncDatabase().then(() => {
        // 3. Render Metrics & Chart
        renderAnalytics();

        // 4. Render CRUD Table
        renderCrudTable();

        // 5. Render Leads Messages
        renderLeads();
    });

    // 6. CRUD Drawer Bindings
    initCrudDrawer();
}

/* ==========================================================================
   1. TAB SWITCHING
   ========================================================================== */
function initTabSwitching() {
    const tabs = document.querySelectorAll('.sidebar-menu-btn');
    const panels = document.querySelectorAll('.dashboard-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            const panel = document.getElementById(targetId);
            if (panel) {
                panel.classList.add('active');
            }
        });
    });
}

/* ==========================================================================
   2. SYNC DATABASE IN LOCALSTORAGE
   ========================================================================== */
function fetchAndSyncDatabase() {
    return new Promise((resolve) => {
        const localDb = localStorage.getItem('properties_db');
        
        if (!localDb) {
            // Seed database from properties.json on first load
            fetch('../data/properties.json')
                .then(res => res.json())
                .then(seedData => {
                    localStorage.setItem('properties_db', JSON.stringify(seedData));
                    resolve();
                });
        } else {
            resolve();
        }
    });
}

function getDatabase() {
    return JSON.parse(localStorage.getItem('properties_db')) || [];
}

function saveDatabase(data) {
    localStorage.setItem('properties_db', JSON.stringify(data));
}

/* ==========================================================================
   3. RENDER ANALYTICS
   ========================================================================== */
function renderAnalytics() {
    const db = getDatabase();
    const leads = JSON.parse(localStorage.getItem('leads_db')) || [];

    // Sum purchase price portfolio value
    const salesTotal = db
        .filter(p => p.status === 'Buy')
        .reduce((sum, p) => sum + p.price, 0);

    const formattedVal = salesTotal >= 1000000 
        ? `$${(salesTotal / 1000000).toFixed(1)}M` 
        : `$${salesTotal.toLocaleString()}`;

    // Calculate average ROI
    const activeRois = db.filter(p => p.roi > 0);
    const avgRoi = activeRois.length > 0 
        ? (activeRois.reduce((sum, p) => sum + p.roi, 0) / activeRois.length).toFixed(1)
        : 0;

    // Set numbers
    document.getElementById('stat-portfolio-val').textContent = formattedVal;
    document.getElementById('stat-leads-count').textContent = leads.length;
    document.getElementById('stat-listings-count').textContent = db.length;
    document.getElementById('stat-avg-roi').textContent = `${avgRoi}%`;

    // Render bar chart by type
    const typeValues = { Villa: 0, Apartment: 0, Plot: 0 };
    db.forEach(p => {
        if (typeValues[p.type] !== undefined) {
            typeValues[p.type] += p.price;
        }
    });

    const ctx = document.getElementById('analytics-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    if (dashboardChartInstance) {
        dashboardChartInstance.destroy();
    }

    dashboardChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Villas', 'Apartments', 'Land Plots'],
            datasets: [{
                label: 'Capital value ($)',
                data: [typeValues.Villa, typeValues.Apartment, typeValues.Plot],
                backgroundColor: '#C9A96E',
                borderRadius: 6,
                barThickness: 30
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#64748B',
                        callback: function(value) {
                            return value >= 1000000 ? `$${(value / 1000000).toFixed(1)}M` : `$${value}`;
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748B' }
                }
            }
        }
    });
}

/* ==========================================================================
   4. PROPERTIES CRUD TABLE
   ========================================================================== */
function renderCrudTable() {
    const tbody = document.getElementById('crud-table-tbody');
    if (!tbody) return;

    const db = getDatabase();
    
    if (db.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-secondary); padding: 3rem;">No properties found in database. Click Add Property to start.</td></tr>`;
        return;
    }

    let html = '';
    db.forEach(item => {
        const formattedPrice = item.price >= 1000000 
            ? `$${(item.price / 1000000).toFixed(2)}M` 
            : `$${item.price.toLocaleString()}${item.status === 'Rent' ? '/mo' : ''}`;

        html += `
            <tr data-id="${item.id}">
                <td data-label="Image"><img src="${item.images[0]}" alt="${item.title}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;"></td>
                <td data-label="Title" style="font-weight:600;">${item.title}</td>
                <td data-label="Location">${item.location}</td>
                <td data-label="Price" style="color:var(--accent-gold); font-weight:600;">${formattedPrice}</td>
                <td data-label="Type">${item.type}</td>
                <td data-label="Status"><span class="card-tag" style="font-size:0.65rem; padding: 0.25rem 0.5rem;">${item.status}</span></td>
                <td data-label="Actions">
                    <div class="crud-actions">
                        <i class="fa-solid fa-pen-to-square crud-btn-edit" data-id="${item.id}"></i>
                        <i class="fa-solid fa-trash-can crud-btn-delete" data-id="${item.id}"></i>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;

    // CRUD click handlers
    tbody.querySelectorAll('.crud-btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            openCrudDrawerForEdit(id);
        });
    });

    tbody.querySelectorAll('.crud-btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            deleteProperty(id);
        });
    });
}

function deleteProperty(id) {
    if (!confirm('Are you sure you want to delete this listing permanently?')) return;
    
    let db = getDatabase();
    db = db.filter(p => p.id !== id);
    saveDatabase(db);
    
    showToast('Listing deleted successfully', 'success');
    renderCrudTable();
    renderAnalytics();
}

/* ==========================================================================
   5. RENDER LEADS MESSAGES
   ========================================================================== */
function renderLeads() {
    const container = document.getElementById('leads-container');
    const label = document.getElementById('leads-inbox-counter');
    if (!container) return;

    const leads = JSON.parse(localStorage.getItem('leads_db')) || [];
    
    if (label) label.textContent = `${leads.length} message${leads.length === 1 ? '' : 's'}`;

    if (leads.length === 0) {
        container.innerHTML = `<div class="glass-panel" style="padding:3rem; text-align:center; color:var(--text-secondary);"><i class="fa-solid fa-comment-slash" style="font-size:2.5rem; color:var(--accent-gold); margin-bottom:1rem;"></i><p>Inbox is empty. Inquiries will appear here.</p></div>`;
        return;
    }

    // Sort leads by newest first
    leads.sort((a, b) => b.id.localeCompare(a.id));

    let html = '';
    leads.forEach(lead => {
        html += `
            <div class="glass-panel lead-card" data-id="${lead.id}">
                <div class="lead-info-col">
                    <h4 style="font-size:1.15rem; font-weight:600;">${lead.name}</h4>
                    <div class="lead-meta-row">
                        <span><i class="fa-solid fa-envelope"></i> ${lead.email}</span>
                        <span><i class="fa-solid fa-phone"></i> ${lead.phone}</span>
                        <span><i class="fa-solid fa-calendar-day"></i> Schedule: ${lead.date}</span>
                    </div>
                    <div class="lead-msg-row">
                        <span style="font-weight:600; color:var(--accent-gold);">Inquiry:</span> "${lead.message}"
                    </div>
                </div>
                <div class="lead-actions-col">
                    <span style="font-size:0.75rem; color:var(--text-secondary);">${lead.timestamp}</span>
                    <button class="btn-secondary lead-delete-btn" data-id="${lead.id}" style="padding:0.4rem 0.85rem; font-size:0.7rem; border-color:var(--error); color:var(--error);"><i class="fa-solid fa-trash"></i> Archive</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;

    container.querySelectorAll('.lead-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            deleteLead(id);
        });
    });
}

function deleteLead(id) {
    let leads = JSON.parse(localStorage.getItem('leads_db')) || [];
    leads = leads.filter(l => l.id !== id);
    localStorage.setItem('leads_db', JSON.stringify(leads));
    
    showToast('Lead archived successfully', 'success');
    renderLeads();
    renderAnalytics();
}

/* ==========================================================================
   6. CRUD FORM DRAWER BINDINGS
   ========================================================================== */
function initCrudDrawer() {
    const drawer = document.getElementById('crud-drawer');
    const backdrop = document.getElementById('crud-backdrop');
    const addBtn = document.getElementById('btn-add-property');
    const closeBtn = document.getElementById('crud-drawer-close');
    const cancelBtn = document.getElementById('crud-drawer-cancel');
    const saveBtn = document.getElementById('crud-drawer-save');
    const form = document.getElementById('crud-property-form');

    if (!drawer || !backdrop) return;

    const openDrawer = () => {
        drawer.classList.add('active');
        backdrop.classList.add('active');
    };

    const closeDrawer = () => {
        drawer.classList.remove('active');
        backdrop.classList.remove('active');
        form.reset();
        document.getElementById('crud-prop-id').value = '';
    };

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            document.getElementById('crud-drawer-title').textContent = 'Add Property';
            openDrawer();
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (cancelBtn) cancelBtn.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const db = getDatabase();
            const idInput = document.getElementById('crud-prop-id').value;

            // Form Values
            const title = document.getElementById('crud-title').value.trim();
            const city = document.getElementById('crud-city').value;
            const location = document.getElementById('crud-location').value.trim();
            const price = parseInt(document.getElementById('crud-price').value) || 0;
            const type = document.getElementById('crud-type').value;
            const status = document.getElementById('crud-status').value;
            const bedrooms = parseInt(document.getElementById('crud-beds').value) || 0;
            const bathrooms = parseInt(document.getElementById('crud-baths').value) || 0;
            const area = parseInt(document.getElementById('crud-area').value) || 0;
            const plotSize = parseFloat(document.getElementById('crud-plot').value) || 0;
            const lat = parseFloat(document.getElementById('crud-lat').value) || 0;
            const lng = parseFloat(document.getElementById('crud-lng').value) || 0;
            const roi = parseFloat(document.getElementById('crud-roi').value) || 0.0;
            const image = document.getElementById('crud-image').value.trim();
            const description = document.getElementById('crud-desc').value.trim();

            if (idInput) {
                // Edit mode
                const index = db.findIndex(p => p.id === idInput);
                if (index !== -1) {
                    db[index] = {
                        ...db[index],
                        title, city, location, price, type, status, bedrooms, bathrooms, area, plotSize,
                        coordinates: [lat, lng], roi,
                        images: [image], description
                    };
                    showToast('Property updated successfully', 'success');
                }
            } else {
                // Add mode
                const newProp = {
                    id: 'prop-' + Date.now(),
                    title, city, location, price, type, status, bedrooms, bathrooms, area, plotSize,
                    coordinates: [lat, lng], roi,
                    images: [image],
                    panoramaUrl: 'https://pannellum.org/images/alma.jpg',
                    videoUrl: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c0227e2b0713d09a25b18a2b5ee57f72&profile_id=164&oauth2_token_id=57447761',
                    builder: 'LuxeHaven Group',
                    amenities: ["Infinity Pool", "Wine Cellar", "Private Spa", "Smart Automation", "Home Cinema"],
                    nearby: {
                        metro: [{"name": "Station Terminal", "distance": "500m"}],
                        school: [{"name": "Curatorship Prep", "distance": "1.0km"}],
                        hospital: [{"name": "General Care", "distance": "1.5km"}],
                        restaurant: [{"name": "Central Lounge", "distance": "100m"}]
                    },
                    agentId: 'agent-1',
                    featured: false
                };
                db.push(newProp);
                showToast('Property added successfully to database', 'success');
            }

            saveDatabase(db);
            closeDrawer();
            renderCrudTable();
            renderAnalytics();
        });
    }
}

function openCrudDrawerForEdit(id) {
    const db = getDatabase();
    const prop = db.find(p => p.id === id);
    if (!prop) return;

    document.getElementById('crud-drawer-title').textContent = 'Edit Property';
    document.getElementById('crud-prop-id').value = prop.id;
    
    document.getElementById('crud-title').value = prop.title;
    document.getElementById('crud-city').value = prop.city;
    document.getElementById('crud-location').value = prop.location;
    document.getElementById('crud-price').value = prop.price;
    document.getElementById('crud-type').value = prop.type;
    document.getElementById('crud-status').value = prop.status;
    document.getElementById('crud-beds').value = prop.bedrooms || 0;
    document.getElementById('crud-baths').value = prop.bathrooms || 0;
    document.getElementById('crud-area').value = prop.area;
    document.getElementById('crud-plot').value = prop.plotSize || 0;
    document.getElementById('crud-lat').value = prop.coordinates ? prop.coordinates[0] : 0;
    document.getElementById('crud-lng').value = prop.coordinates ? prop.coordinates[1] : 0;
    document.getElementById('crud-roi').value = prop.roi || 0.0;
    document.getElementById('crud-image').value = prop.images[0] || '';
    document.getElementById('crud-desc').value = prop.description;

    // Slide open drawer
    document.getElementById('crud-drawer').classList.add('active');
    document.getElementById('crud-backdrop').classList.add('active');
}
