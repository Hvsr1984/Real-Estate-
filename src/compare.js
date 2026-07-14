/* src/compare.js - Multiple Properties Comparison Matrix */

import { showToast } from './app.js';
import { formatPrice, formatArea, formatPlot } from './utils/formatters.js';

let compareList = [];

document.addEventListener('DOMContentLoaded', () => {
    initComparisonEngine();
});

function initComparisonEngine() {
    const drawer = document.getElementById('compare-drawer');
    const closeBtn = document.getElementById('compare-drawer-close');
    const launchBtn = document.getElementById('compare-launch-btn');
    const modal = document.getElementById('compare-modal-overlay');
    const modalClose = document.getElementById('compare-modal-close');

    if (!drawer) return;

    // Listeners for checkbox toggling
    document.addEventListener('change', (e) => {
        const chk = e.target.closest('.compare-chkbox');
        if (chk) {
            const id = chk.getAttribute('data-id');
            if (chk.checked) {
                addToCompare(id, chk);
            } else {
                removeFromCompare(id);
            }
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            drawer.classList.remove('active');
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    if (launchBtn) {
        launchBtn.addEventListener('click', () => {
            if (compareList.length < 2) {
                showToast('Please select at least 2 properties to compare', 'error');
                return;
            }
            renderCompareMatrix();
            modal.classList.add('active');
        });
    }
}

function addToCompare(id, checkboxEl) {
    if (compareList.length >= 4) {
        if (checkboxEl) checkboxEl.checked = false;
        showToast('You can compare a maximum of 4 properties', 'error');
        return;
    }

    if (!compareList.includes(id)) {
        compareList.push(id);
        showToast('Property added to comparison list', 'success');
        updateCompareSlots();
    }
}

function removeFromCompare(id) {
    const idx = compareList.indexOf(id);
    if (idx !== -1) {
        compareList.splice(idx, 1);
        showToast('Property removed from comparison list', 'success');
        updateCompareSlots();
    }
}

export function updateCompareSlots() {
    const drawer = document.getElementById('compare-drawer');
    if (!drawer) return;

    // Toggle drawer display
    if (compareList.length > 0) {
        drawer.classList.add('active');
    } else {
        drawer.classList.remove('active');
    }

    // Sync card checkboxes
    document.querySelectorAll('.compare-chkbox').forEach(chk => {
        const id = chk.getAttribute('data-id');
        chk.checked = compareList.includes(id);
    });

    // Populate slot contents
    fetch('../data/properties.json')
        .then(res => res.json())
        .then(properties => {
            const cmsDb = JSON.parse(localStorage.getItem('properties_db')) || [];
            const combined = [...properties, ...cmsDb];
            
            for (let i = 1; i <= 4; i++) {
                const slot = document.getElementById(`compare-slot-${i}`);
                if (!slot) continue;

                const itemId = compareList[i - 1];
                if (itemId) {
                    const item = combined.find(p => p.id === itemId);
                    if (item) {
                        const formattedPrice = formatPrice(item.price || item.rentPrice, item.status);

                        slot.className = 'compare-item-slot filled';
                        slot.innerHTML = `
                            <img src="${item.images[0]}" alt="${item.title}" class="compare-slot-thumb">
                            <div class="compare-slot-info">
                                <h5>${item.title}</h5>
                                <span>${formattedPrice}</span>
                            </div>
                            <i class="fa-solid fa-circle-xmark compare-slot-remove" data-id="${item.id}"></i>
                        `;
                    }
                } else {
                    slot.className = 'compare-item-slot';
                    slot.innerHTML = `<div class="compare-empty-label" style="font-size:0.8rem; color:var(--text-secondary);">Select Property</div>`;
                }
            }

            // Bind click events on remove icons inside drawer
            drawer.querySelectorAll('.compare-slot-remove').forEach(removeBtn => {
                removeBtn.addEventListener('click', () => {
                    const id = removeBtn.getAttribute('data-id');
                    removeFromCompare(id);
                });
            });
        });
}

function renderCompareMatrix() {
    const table = document.getElementById('compare-matrix-table');
    if (!table) return;

    fetch('../data/properties.json')
        .then(res => res.json())
        .then(properties => {
            const cmsDb = JSON.parse(localStorage.getItem('properties_db')) || [];
            const combined = [...properties, ...cmsDb];
            const items = combined.filter(p => compareList.includes(p.id));

            let html = '';

            // Header row with photos & titles
            html += `<tr><th>Specs</th>`;
            items.forEach(item => {
                const formattedPrice = formatPrice(item.price || item.rentPrice, item.status);

                html += `
                    <th>
                        <img src="${item.images[0]}" alt="${item.title}" class="compare-th-img"><br>
                        <span style="font-size:1.1rem; color:var(--text-primary); font-weight:600;">${item.title}</span><br>
                        <span style="color:var(--accent-gold); font-size:1.2rem; font-family:var(--font-heading);">${formattedPrice}</span>
                    </th>
                `;
            });
            html += `</tr>`;

            // Fields mapping
            const rows = [
                { label: 'Locality & City', key: 'locality', format: (v, item) => `${item.locality}, ${item.city}` },
                { label: 'Property Type', key: 'propertyType' },
                { label: 'Status', key: 'status' },
                { label: 'BHK Configuration', key: 'bhk', suffix: ' BHK' },
                { label: 'Area Size', key: 'area', format: (val) => formatArea(val) },
                { label: 'Plot Size', key: 'plotSize', format: (val) => formatPlot(val) },
                { label: 'RERA Registration', key: 'reraNumber' },
                { label: 'Builder Developer', key: 'builderId', format: (val) => String(val).toUpperCase() },
                { label: 'Rental Yield', key: 'rentalYield', suffix: '%' },
                { label: 'ROI Yield', key: 'roi', suffix: '%' },
                { label: 'AI Luxury Rating', key: 'luxuryScore', suffix: '/10' },
                { label: 'AI Connectivity Score', key: 'connectivityScore', suffix: '/10' },
                { label: 'AI Lifestyle Score', key: 'lifestyleScore', suffix: '/10' },
                { label: 'Amenities Included', key: 'amenities', isArray: true }
            ];

            rows.forEach(row => {
                html += `<tr><td style="font-weight:600; color:var(--accent-gold);">${row.label}</td>`;
                items.forEach(item => {
                    let val = '';
                    if (row.format) {
                        val = row.format(item[row.key], item);
                    } else {
                        val = item[row.key];
                        if (row.isArray && Array.isArray(val)) {
                            val = val.join(', ');
                        } else if (val === undefined || val === null || val === 0) {
                            val = 'N/A';
                        } else if (row.suffix) {
                            val = val + row.suffix;
                        }
                    }
                    html += `<td data-label="${row.label}">${val}</td>`;
                });
                html += `</tr>`;
            });

            table.innerHTML = html;
        });
}
