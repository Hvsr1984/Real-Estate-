/* src/controllers/DashboardController.js - UI controller for the admin panel */

import { propertyService } from '../services/property/propertyService.js';
import { authService } from '../services/auth/authService.js';
import { analyticsService } from '../services/analytics/analyticsService.js';
import { databaseService } from '../services/databaseService.js';
import { BaseRepository } from '../../database/repositories/BaseRepository.js';
import { COLLECTIONS, SUBMISSION_STATUSES } from '../../config/constants.js';
import { eventBus } from '../core/eventBus.js';
import { showToast } from '../app.js';
import { formatPrice, formatShortVal } from '../utils/formatters.js';
import { bookingService } from '../services/booking/bookingService.js';

export class DashboardController {
    constructor() {
        const adapter = databaseService.getAdapter();
        this.auditRepo = new BaseRepository(adapter, COLLECTIONS.AUDIT_LOGS);
        this.submissions = [];
        this.activeSubTab = 'Pending'; // Sub-tabs: Pending, Approved, Rejected, Archived
        this.chartInstance = null;
    }

    async init() {
        // Guard check: is admin authenticated?
        if (!authService.isAdmin()) {
            this.renderLockoutScreen();
            return;
        }

        // Initialize tabs
        this.initSidebarTabs();

        // Load metrics and charts
        await this.loadAnalytics();

        // Load Submissions list
        await this.loadSubmissions();

        // Load Properties CRUD list
        await this.loadProperties();

        // Load Leads list
        await this.loadLeads();

        // Bind Sub-tabs (Pending, Approved, etc.)
        this.bindSubTabListeners();

        // Bind CRUD form drawer events
        this.bindCrudEvents();

        // Load Audit Logs
        await this.loadAuditLogs();

        // Load System Health
        this.loadSystemHealth();

        // Log login action
        this.logAuditAction('Login', 'Admin logged into Dashboard');
    }

    renderLockoutScreen() {
        const blocker = document.createElement('div');
        blocker.id = 'auth-blocker-panel';
        blocker.style = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(5,7,12,0.95); backdrop-filter:blur(10px); z-index:2000; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2rem;';
        
        blocker.innerHTML = `
            <i class="fa-solid fa-lock" style="font-size:4rem; color:var(--accent-gold); animation: pulse 2s infinite;"></i>
            <div style="text-align:center;">
                <h2 style="font-family:var(--font-heading); text-transform:uppercase; color:#FFF; margin-bottom:0.75rem;">CMS Security Lockout</h2>
                <p style="color:var(--text-secondary); font-size:0.95rem; max-width:400px; margin:0 auto; padding:0 1rem;">Authenticating credentials is required to review platform analytics and execute CRUD listings alterations.</p>
            </div>
            <button class="btn-primary" id="btn-lockout-login">Authenticate Identity <i class="fa-solid fa-user-shield"></i></button>
        `;
        document.body.appendChild(blocker);

        blocker.querySelector('#btn-lockout-login').addEventListener('click', () => {
            const modal = document.getElementById('auth-modal-overlay');
            if (modal) modal.classList.add('active');
        });

        // Trigger updates if user logs in successfully
        eventBus.on('auth.login', () => {
            if (authService.isAdmin()) {
                blocker.remove();
                window.location.reload();
            } else {
                showToast("Access restricted: Admin roles required.", "error");
            }
        });
    }

    async logAuditAction(action, description) {
        const user = authService.getCurrentUser();
        await this.auditRepo.create({
            id: `audit-${Date.now()}`,
            user: user?.email || 'Anonymous Admin',
            action,
            description,
            timestamp: new Date().toISOString(),
            browser: navigator.userAgent
        });
    }

    initSidebarTabs() {
        const tabs = document.querySelectorAll('.sidebar-menu-btn');
        const panels = document.querySelectorAll('.dashboard-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));

                tab.classList.add('active');
                const targetId = tab.getAttribute('data-tab');
                const panel = document.getElementById(targetId);
                if (panel) panel.classList.add('active');
            });
        });
    }

    async loadAnalytics() {
        const db = await propertyService.propertyRepo.getAll();
        const approved = db.filter(p => p.moderationStatus === 'Approved' || p.status === 'Approved');

        const salesTotal = approved
            .filter(p => p.status !== 'Rent')
            .reduce((sum, p) => sum + (p.price || 0), 0);

        // Format total portfolio value using localized Indian Rupees shorthand
        const formattedVal = formatShortVal(salesTotal);

        // Populate metrics in DOM
        const totalValueEl = document.getElementById('stat-portfolio-val');
        if (totalValueEl) totalValueEl.textContent = formattedVal;

        const countEl = document.getElementById('stat-listings-count');
        if (countEl) countEl.textContent = approved.length;

        // Calculate average yield ROI
        const roiSum = approved.reduce((sum, p) => sum + (p.roi || 0), 0);
        const avgRoi = approved.length > 0 ? (roiSum / approved.length).toFixed(1) : '0.0';
        const avgRoiEl = document.getElementById('stat-avg-roi');
        if (avgRoiEl) avgRoiEl.textContent = `${avgRoi}%`;

        // Load ChartJS on correct element ID
        this.renderAnalyticsChart(approved);
    }

    renderAnalyticsChart(properties) {
        const ctx = document.getElementById('analytics-chart');
        if (!ctx) return;

        // Group properties by region
        const regions = {};
        properties.forEach(p => {
            if (p.city) {
                regions[p.city] = (regions[p.city] || 0) + 1;
            }
        });

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        if (typeof Chart === 'undefined') return;

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(regions),
                datasets: [{
                    label: 'Properties by Region',
                    data: Object.values(regions),
                    backgroundColor: '#C9A96E', // Gold
                    borderColor: '#05070C',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: '#8B95A5' } }
                },
                scales: {
                    x: { ticks: { color: '#8B95A5' } },
                    y: { ticks: { color: '#8B95A5' }, grid: { color: '#172132' } }
                }
            }
        });
    }

    async loadSubmissions() {
        try {
            this.submissions = await propertyService.getAllSubmissions();
            this.renderSubmissionsGrid();
        } catch (e) {
            console.error("Error loading submissions:", e);
        }
    }

    bindSubTabListeners() {
        const subTabs = document.querySelectorAll('.moderation-sub-tab');
        subTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                subTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.activeSubTab = tab.getAttribute('data-status');
                this.renderSubmissionsGrid();
            });
        });
    }

    renderSubmissionsGrid() {
        const tbody = document.getElementById('moderation-table-body');
        if (!tbody) return;

        const filtered = this.submissions.filter(s => s.status === this.activeSubTab);
        
        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:3rem; color:var(--text-secondary);">
                        <i class="fa-solid fa-clipboard-question" style="font-size:2rem; margin-bottom:1rem; color:var(--accent-gold);"></i>
                        <div>No submissions found in this category.</div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        filtered.forEach(item => {
            const formattedPrice = formatPrice(item.price || item.rentPrice, item.status);

            html += `
                <tr data-id="${item.id}">
                    <td style="width:30px;"><input type="checkbox" class="sub-row-chk" data-id="${item.id}"></td>
                    <td><strong>${item.title}</strong><div style="font-size:0.75rem; color:var(--text-secondary);">${item.type}</div></td>
                    <td>${item.city}</td>
                    <td>${formattedPrice}</td>
                    <td>
                        <div style="font-size:0.8rem; font-weight:600;">${item.ownerName}</div>
                        <div style="font-size:0.7rem; color:var(--text-secondary);">${item.email}</div>
                    </td>
                    <td><span class="badge" style="background:${this.getBadgeColor(item.status)}; color:#FFF;">${item.status}</span></td>
                    <td>
                        <div class="crud-actions">
                            <i class="fa-solid fa-eye view-details-btn" data-id="${item.id}" title="Review Details" style="cursor:pointer; color:var(--accent-gold);"></i>
                            ${item.status === 'Pending' ? `
                                <i class="fa-solid fa-circle-check approve-btn" data-id="${item.id}" title="Approve Listing" style="cursor:pointer; color:#10B981;"></i>
                                <i class="fa-solid fa-circle-xmark reject-btn" data-id="${item.id}" title="Reject Listing" style="cursor:pointer; color:var(--error);"></i>
                            ` : ''}
                            <i class="fa-solid fa-trash delete-submission-btn" data-id="${item.id}" title="Delete" style="cursor:pointer; color:var(--error);"></i>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

        // Bind Row Listeners
        tbody.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.showDetailsModal(e.target.getAttribute('data-id')));
        });
        tbody.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.approveListing(e.target.getAttribute('data-id')));
        });
        tbody.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.rejectListing(e.target.getAttribute('data-id')));
        });
        tbody.querySelectorAll('.delete-submission-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.deleteSubmission(e.target.getAttribute('data-id')));
        });
    }

    getBadgeColor(status) {
        switch (status) {
            case 'Pending': return '#F59E0B';
            case 'Approved': return '#10B981';
            case 'Rejected': return '#EF4444';
            default: return '#6B7280';
        }
    }

    async approveListing(id) {
        if (!confirm("Are you sure you want to approve this listing submission and publish it?")) return;
        
        try {
            const user = authService.getCurrentUser();
            await propertyService.approveSubmission(id, user?.name);
            await this.logAuditAction('Approve', `Approved submission ID: ${id}`);
            await this.loadSubmissions();
            await this.loadAnalytics();
        } catch (e) {
            showToast("Approval failed: " + e.message, "error");
        }
    }

    async rejectListing(id) {
        const reason = prompt("Enter reason for rejection:");
        if (reason === null) return; // cancelled

        try {
            await propertyService.rejectSubmission(id, reason);
            await this.logAuditAction('Reject', `Rejected submission ID: ${id}. Reason: ${reason}`);
            await this.loadSubmissions();
        } catch (e) {
            showToast("Rejection update failed.", "error");
        }
    }

    async deleteSubmission(id) {
        if (!confirm("Permanently delete this property submission?")) return;

        try {
            const adapter = databaseService.getAdapter();
            await adapter.delete(COLLECTIONS.SUBMISSIONS, id);
            await this.logAuditAction('Delete', `Deleted submission ID: ${id}`);
            showToast("Submission deleted.", "success");
            await this.loadSubmissions();
        } catch (e) {
            showToast("Delete failed.", "error");
        }
    }

    showDetailsModal(id) {
        const item = this.submissions.find(s => s.id === id);
        if (!item) return;

        const overlay = document.createElement('div');
        overlay.className = 'compare-modal-overlay active';
        overlay.style = 'z-index: 1060;';

        overlay.innerHTML = `
            <div class="compare-modal-container glass-panel animate-scale" style="max-width:800px; padding:2.5rem; overflow-y:auto; max-height:85vh; color:#FFF;">
                <i class="fa-solid fa-xmark modal-close" id="details-modal-close" style="position:absolute; top:20px; right:20px; font-size:1.5rem; cursor:pointer; color:#FFF;"></i>
                <h3 style="font-family:var(--font-heading); text-transform:uppercase; margin-bottom:1.5rem; border-bottom:1px solid var(--glass-border); padding-bottom:0.75rem;">Listing Review Details</h3>
                
                <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:2.5rem;">
                    <!-- Left Col -->
                    <div style="display:flex; flex-direction:column; gap:1.5rem;">
                        <div>
                            <h4 style="font-size:1.2rem; color:var(--accent-gold); margin-bottom:0.25rem;">${item.title}</h4>
                            <p style="font-size:0.8rem; color:var(--text-secondary);"><i class="fa-solid fa-location-dot"></i> ${item.address}, ${item.city}</p>
                        </div>
                        <div style="display:flex; gap:1.5rem; font-size:0.85rem;">
                            <span><strong>Beds:</strong> ${item.bedrooms}</span>
                            <span><strong>Baths:</strong> ${item.bathrooms}</span>
                            <span><strong>Area:</strong> ${item.area} M²</span>
                            <span><strong>Type:</strong> ${item.type}</span>
                        </div>
                        <div>
                            <h5 style="color:var(--accent-gold); margin-bottom:0.5rem;">Description</h5>
                            <p style="font-size:0.85rem; line-height:1.6; color:var(--text-secondary);">${item.description}</p>
                        </div>
                        <div>
                            <h5 style="color:var(--accent-gold); margin-bottom:0.5rem;">Image Gallery</h5>
                            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                                ${item.images.map(img => `<img src="${img}" style="width:100px; height:70px; object-fit:cover; border-radius:4px;">`).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Right Col -->
                    <div style="display:flex; flex-direction:column; gap:1.5rem; border-left:1px solid var(--glass-border); padding-left:1.5rem;">
                        <div>
                            <h5 style="color:var(--accent-gold); margin-bottom:0.5rem;">Owner Coordinates</h5>
                            <div style="font-size:0.85rem; display:flex; flex-direction:column; gap:0.4rem;">
                                <div><strong>Name:</strong> ${item.ownerName}</div>
                                <div><strong>Email:</strong> ${item.email}</div>
                                <div><strong>Phone:</strong> ${item.phone}</div>
                                <div><strong>WhatsApp:</strong> ${item.whatsapp || 'N/A'}</div>
                            </div>
                        </div>
                        <div>
                            <h5 style="color:var(--accent-gold); margin-bottom:0.5rem;">Curation Tags</h5>
                            <div style="display:flex; flex-direction:column; gap:0.5rem;">
                                <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.8rem;">
                                    <input type="checkbox" class="badge-chk" value="Verified Listing" ${item.badges?.includes('Verified Listing') ? 'checked' : ''}> Verified Listing
                                </label>
                                <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.8rem;">
                                    <input type="checkbox" class="badge-chk" value="Premium Listing" ${item.badges?.includes('Premium Listing') ? 'checked' : ''}> Premium Listing
                                </label>
                                <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.8rem;">
                                    <input type="checkbox" class="badge-chk" value="Featured Listing" ${item.badges?.includes('Featured Listing') ? 'checked' : ''}> Featured Listing
                                </label>
                            </div>
                        </div>
                        <div style="margin-top:auto; display:flex; gap:0.5rem;">
                            <button class="btn-primary" id="btn-save-badges" style="width:100%; justify-content:center;">Save Tags <i class="fa-solid fa-save"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#details-modal-close').addEventListener('click', () => overlay.remove());

        // Save Badges listener
        overlay.querySelector('#btn-save-badges').addEventListener('click', async () => {
            const badges = [];
            overlay.querySelectorAll('.badge-chk:checked').forEach(chk => {
                badges.push(chk.value);
            });

            try {
                const adapter = databaseService.getAdapter();
                await adapter.update(COLLECTIONS.SUBMISSIONS, id, { badges });
                
                // If already approved, sync to public repo as well
                const pub = await propertyService.propertyRepo.findById(id);
                if (pub) {
                    await propertyService.propertyRepo.update(id, { badges });
                }

                showToast("Curation tags updated successfully.", "success");
                overlay.remove();
                await this.loadSubmissions();
            } catch (e) {
                showToast("Update failed.", "error");
            }
        });
    }

    async loadAuditLogs() {
        const container = document.getElementById('audit-table-body');
        if (!container) return;

        try {
            const list = await this.auditRepo.getAll();
            // Sort by timestamp desc
            list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            if (list.length === 0) {
                container.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-secondary);">No action audits logged.</td></tr>`;
                return;
            }

            let html = '';
            list.slice(0, 50).forEach(log => {
                html += `
                    <tr>
                        <td><strong>${log.action}</strong></td>
                        <td>${log.user}</td>
                        <td style="font-size:0.8rem; color:var(--text-secondary);">${log.description}</td>
                        <td>${new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                `;
            });

            container.innerHTML = html;
        } catch (e) {
            console.error("Error loading audit logs:", e);
        }
    }

    loadSystemHealth() {
        const readEl = document.getElementById('health-reads');
        const writeEl = document.getElementById('health-writes');
        const apiEl = document.getElementById('health-api-calls');

        if (readEl) readEl.textContent = Math.floor(Math.random() * 200) + 50;
        if (writeEl) writeEl.textContent = Math.floor(Math.random() * 40) + 10;
        if (apiEl) apiEl.textContent = Math.floor(Math.random() * 100) + 20;

        // Render mock system error logs
        const errorBody = document.getElementById('system-errors-body');
        if (errorBody) {
            errorBody.innerHTML = `
                <tr>
                    <td>GPS Location query timeout</td>
                    <td>High</td>
                    <td>${new Date().toLocaleTimeString()}</td>
                </tr>
                <tr>
                    <td>Failed to load Google Maps script (retried)</td>
                    <td>Low</td>
                    <td>${new Date(Date.now() - 300000).toLocaleTimeString()}</td>
                </tr>
            `;
        }
    }

    /* ==========================================================================
       PROPERTIES CRUD PANEL AND DRAWER OPERATIONS
       ========================================================================== */
    async loadProperties() {
        const tbody = document.getElementById('crud-table-tbody');
        if (!tbody) return;

        try {
            const properties = await propertyService.propertyRepo.getAll();
            const approved = properties.filter(p => p.moderationStatus === 'Approved' || p.status === 'Approved');

            if (approved.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-secondary);">No properties found.</td></tr>`;
                return;
            }

            let html = '';
            approved.forEach(item => {
                const formattedPrice = formatPrice(item.price || item.rentPrice, item.status);
                const thumb = item.images && item.images[0] ? item.images[0] : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=150&h=150&q=80';
                
                html += `
                    <tr data-id="${item.id}">
                        <td><img src="${thumb}" style="width:60px; height:45px; object-fit:cover; border-radius:4px;"></td>
                        <td><strong>${item.title}</strong><div style="font-size:0.75rem; color:var(--text-secondary);">${item.propertyType || item.type || 'N/A'}</div></td>
                        <td>${item.locality || item.location}, ${item.city}</td>
                        <td style="color:var(--accent-gold); font-weight:600;">${formattedPrice}</td>
                        <td>${item.propertyType || item.type || 'N/A'}</td>
                        <td><span class="badge" style="background:#10B981; color:#FFF;">Approved</span></td>
                        <td>
                            <div class="crud-actions">
                                <i class="fa-solid fa-pen-to-square edit-property-btn" data-id="${item.id}" title="Edit Property" style="cursor:pointer; color:var(--success); font-size:1.1rem; margin-right:8px;"></i>
                                <i class="fa-solid fa-trash delete-property-btn" data-id="${item.id}" title="Delete Property" style="cursor:pointer; color:var(--error); font-size:1.1rem;"></i>
                            </div>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;

            // Bind click events on Edit/Delete buttons
            tbody.querySelectorAll('.edit-property-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id') || e.target.closest('.edit-property-btn').getAttribute('data-id');
                    this.openCrudDrawer(id);
                });
            });
            tbody.querySelectorAll('.delete-property-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id') || e.target.closest('.delete-property-btn').getAttribute('data-id');
                    this.deleteProperty(id);
                });
            });
        } catch (e) {
            console.error("Error loading properties CRUD:", e);
        }
    }

    async deleteProperty(id) {
        if (!confirm("Are you sure you want to delete this property? It will be archived in history.")) return;
        try {
            const user = authService.getCurrentUser();
            await propertyService.deleteProperty(id, user?.name);
            await this.logAuditAction('Delete', `Deleted property ID: ${id}`);
            showToast("Property deleted successfully.", "success");
            await this.loadProperties();
            await this.loadAnalytics();
        } catch (e) {
            showToast("Failed to delete property: " + e.message, "error");
        }
    }

    bindCrudEvents() {
        const addBtn = document.getElementById('btn-add-property');
        const drawer = document.getElementById('crud-drawer');
        const backdrop = document.getElementById('crud-backdrop');
        const closeBtn = document.getElementById('crud-drawer-close');
        const cancelBtn = document.getElementById('crud-drawer-cancel');
        const form = document.getElementById('crud-property-form');

        if (!drawer) return;

        if (addBtn) {
            addBtn.addEventListener('click', () => this.openCrudDrawer(null));
        }

        const closeDrawer = () => {
            drawer.classList.remove('active');
            if (backdrop) backdrop.classList.remove('active');
            if (form) form.reset();
        };

        if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
        if (cancelBtn) cancelBtn.addEventListener('click', closeDrawer);
        if (backdrop) backdrop.addEventListener('click', closeDrawer);

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.savePropertyFromForm(closeDrawer);
            });
        }

        const saveBtn = document.getElementById('crud-drawer-save');
        if (saveBtn && form) {
            saveBtn.addEventListener('click', () => {
                form.requestSubmit();
            });
        }
    }

    async openCrudDrawer(id = null) {
        const drawer = document.getElementById('crud-drawer');
        const backdrop = document.getElementById('crud-backdrop');
        const titleEl = document.getElementById('crud-drawer-title');
        const form = document.getElementById('crud-property-form');

        if (!drawer) return;

        drawer.classList.add('active');
        if (backdrop) backdrop.classList.add('active');

        if (id) {
            if (titleEl) titleEl.textContent = "Edit Property";
            try {
                const item = await propertyService.getPropertyById(id);
                if (item) {
                    document.getElementById('crud-prop-id').value = item.id;
                    document.getElementById('crud-title').value = item.title;
                    document.getElementById('crud-city').value = item.city;
                    document.getElementById('crud-location').value = item.locality || item.location;
                    document.getElementById('crud-price').value = item.price;
                    document.getElementById('crud-type').value = item.propertyType || item.type || 'Villa';
                    document.getElementById('crud-status').value = item.status;
                    document.getElementById('crud-beds').value = item.bhk || item.bedrooms || 4;
                    document.getElementById('crud-baths').value = item.bathrooms || 4;
                    document.getElementById('crud-area').value = item.area;
                    document.getElementById('crud-plot').value = item.plotSize || 0;
                    document.getElementById('crud-lat').value = item.coordinates?.[0] || 0;
                    document.getElementById('crud-lng').value = item.coordinates?.[1] || 0;
                    document.getElementById('crud-roi').value = item.roi || 6.0;
                    document.getElementById('crud-image').value = item.images?.[0] || '';
                    document.getElementById('crud-desc').value = item.description || '';
                }
            } catch (e) {
                console.error("Error loading property for edit:", e);
            }
        } else {
            if (titleEl) titleEl.textContent = "Add Property";
            if (form) form.reset();
            document.getElementById('crud-prop-id').value = '';
            document.getElementById('crud-lat').value = 19.0760;
            document.getElementById('crud-lng').value = 72.8777;
        }
    }

    async savePropertyFromForm(closeDrawerCallback) {
        const id = document.getElementById('crud-prop-id').value;
        const title = document.getElementById('crud-title').value.trim();
        const city = document.getElementById('crud-city').value;
        const location = document.getElementById('crud-location').value.trim();
        const price = parseFloat(document.getElementById('crud-price').value);
        const type = document.getElementById('crud-type').value;
        const status = document.getElementById('crud-status').value;
        const beds = parseInt(document.getElementById('crud-beds').value);
        const baths = parseInt(document.getElementById('crud-baths').value);
        const area = parseFloat(document.getElementById('crud-area').value);
        const plot = parseFloat(document.getElementById('crud-plot').value);
        const lat = parseFloat(document.getElementById('crud-lat').value);
        const lng = parseFloat(document.getElementById('crud-lng').value);
        const roi = parseFloat(document.getElementById('crud-roi').value);
        const image = document.getElementById('crud-image').value.trim();
        const desc = document.getElementById('crud-desc').value.trim();

        const propertyData = {
            title,
            builderId: title.toLowerCase().split(' ')[0],
            city,
            locality: location,
            coordinates: [lat, lng],
            propertyType: type,
            bhk: beds,
            bathrooms: baths,
            area,
            plotSize: plot,
            price,
            rentPrice: status === 'Rent' ? price : 0,
            status,
            description: desc,
            images: image ? [image] : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'],
            roi,
            luxuryScore: 9.0 + (Math.random() * 1.0),
            connectivityScore: 9.0 + (Math.random() * 1.0),
            lifestyleScore: 9.0 + (Math.random() * 1.0),
            amenities: ["Security", "Clubhouse", "Elevator"]
        };

        try {
            const user = authService.getCurrentUser();
            if (id) {
                propertyData.id = id;
                await propertyService.propertyRepo.update(id, propertyData);
                await this.logAuditAction('Update', `Updated property: ${title} (ID: ${id})`);
                showToast("Property updated successfully.", "success");
            } else {
                propertyData.moderationStatus = 'Approved';
                propertyData.verified = true;
                propertyData.approvedAt = new Date().toISOString();
                propertyData.approvedBy = user?.name || 'System Admin';
                
                await propertyService.propertyRepo.create(propertyData);
                await this.logAuditAction('Create', `Created property: ${title}`);
                showToast("Property added successfully.", "success");
            }
            closeDrawerCallback();
            await this.loadProperties();
            await this.loadAnalytics();
        } catch (e) {
            showToast("Failed to save property: " + e.message, "error");
        }
    }

    /* ==========================================================================
       LEADS AND SITE VISIT INBOX OPERATIONS
       ========================================================================== */
    async loadLeads() {
        const container = document.getElementById('leads-container');
        const counter = document.getElementById('leads-inbox-counter');
        if (!container) return;

        try {
            const leads = JSON.parse(localStorage.getItem('leads_db')) || [];
            const bookings = await bookingService.getBookings();
            const allLeads = [];
            
            leads.forEach(lead => {
                allLeads.push({
                    type: 'Inquiry',
                    name: lead.name,
                    email: lead.email,
                    phone: lead.phone,
                    dateOrTarget: lead.date || lead.propertyId || 'General Inquiry',
                    message: lead.message,
                    timestamp: lead.timestamp || new Date().toLocaleString(),
                    rawTimestamp: lead.id ? parseInt(lead.id.split('-')[1]) : Date.now()
                });
            });

            bookings.forEach(b => {
                allLeads.push({
                    type: 'Site Visit Booking',
                    name: b.name,
                    email: b.email,
                    phone: b.phone,
                    dateOrTarget: `Scheduled for: ${b.date}`,
                    message: `Target Property: ${b.propertyTitle || b.propertyId}. Note: ${b.message || 'No additional note'}`,
                    timestamp: new Date(b.createdAt).toLocaleString(),
                    rawTimestamp: new Date(b.createdAt).getTime()
                });
            });

            allLeads.sort((a, b) => b.rawTimestamp - a.rawTimestamp);

            if (counter) {
                counter.textContent = `${allLeads.length} active leads`;
            }

            const statsLeadsCount = document.getElementById('stat-leads-count');
            if (statsLeadsCount) {
                statsLeadsCount.textContent = allLeads.length;
            }

            if (allLeads.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center; padding:3rem; color:var(--text-secondary);">
                        <i class="fa-solid fa-envelope-open" style="font-size:2rem; margin-bottom:1rem; color:var(--accent-gold);"></i>
                        <div>Leads inbox is currently empty.</div>
                    </div>
                `;
                return;
            }

            let html = '';
            allLeads.forEach(lead => {
                const icon = lead.type === 'Site Visit Booking' ? 'fa-calendar-check' : 'fa-envelope';
                const badgeColor = lead.type === 'Site Visit Booking' ? '#C9A96E' : 'rgba(255,255,255,0.15)';
                const badgeTxtColor = lead.type === 'Site Visit Booking' ? '#05070C' : '#FFF';
                
                html += `
                    <div class="glass-panel lead-card" style="padding:1.5rem; margin-bottom:1rem; border-radius:var(--border-radius-md); display:flex; flex-direction:column; gap:0.75rem;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div>
                                <h4 style="font-size:1.05rem; font-weight:600; color:#FFF;">${lead.name}</h4>
                                <span style="font-size:0.75rem; color:var(--text-secondary);"><i class="fa-regular fa-clock"></i> ${lead.timestamp}</span>
                            </div>
                            <span class="badge" style="background:${badgeColor}; color:${badgeTxtColor}; border:none; padding:0.35rem 0.75rem; font-size:0.7rem;"><i class="fa-solid ${icon}"></i> ${lead.type}</span>
                        </div>
                        <div style="font-size:0.85rem; color:var(--text-secondary); line-height:1.5;">
                            <div><strong>Email:</strong> ${lead.email} | <strong>Phone:</strong> ${lead.phone}</div>
                            <div style="margin-top:0.25rem;"><strong>Detail:</strong> ${lead.dateOrTarget}</div>
                            <p style="margin-top:0.5rem; padding:0.5rem; background:rgba(255,255,255,0.02); border-left:2px solid var(--accent-gold);">${lead.message}</p>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;

        } catch (e) {
            console.error("Error loading leads inbox:", e);
        }
    }
}
