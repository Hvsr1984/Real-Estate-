/* js/map.js - Leaflet Map Integration & Coordinate Marker Plotter */

let mapInstance = null;
let markerLayerGroup = null;

export function initListingsMap(elementId = 'listings-map', defaultCenter = [34.0522, -118.2437], defaultZoom = 10) {
    const mapContainer = document.getElementById(elementId);
    if (!mapContainer || typeof L === 'undefined') return null;

    // Destroy existing map instance if already initialized
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }

    // Initialize map
    mapInstance = L.map(elementId, {
        zoomControl: false,
        scrollWheelZoom: false
    }).setView(defaultCenter, defaultZoom);

    // Add luxury dark tileset from CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(mapInstance);

    // Re-add Zoom control at bottom right
    L.control.zoom({
        position: 'bottomright'
    }).addTo(mapInstance);

    markerLayerGroup = L.layerGroup().addTo(mapInstance);

    return mapInstance;
}

export function plotPropertyMarkers(properties) {
    if (!mapInstance || !markerLayerGroup || typeof L === 'undefined') return;

    // Clear existing markers
    markerLayerGroup.clearLayers();

    if (properties.length === 0) return;

    const bounds = [];

    // Custom Gold Pin icon
    const goldIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="width: 20px; height: 20px; background-color: #C9A96E; border: 3px solid #05070C; border-radius: 50%; box-shadow: 0 0 10px rgba(201, 169, 110, 0.6); transition: transform 0.2s;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    properties.forEach(prop => {
        if (!prop.coordinates || prop.coordinates.length < 2) return;

        const [lat, lng] = prop.coordinates;
        bounds.push([lat, lng]);

        const formattedPrice = prop.price >= 1000000 
            ? `$${(prop.price / 1000000).toFixed(2)}M` 
            : `$${prop.price.toLocaleString()}${prop.status === 'Rent' ? '/mo' : ''}`;

        const popupHtml = `
            <div class="map-popup-card">
                <img src="${prop.images[0]}" alt="${prop.title}" class="map-popup-img">
                <div class="map-popup-desc">
                    <h4>${prop.title}</h4>
                    <p><i class="fa-solid fa-location-dot"></i> ${prop.location}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="map-popup-price">${formattedPrice}</span>
                        <a href="property.html?id=${prop.id}" style="font-size:0.75rem; color:#C9A96E; font-weight:600;">View Details <i class="fa-solid fa-arrow-right"></i></a>
                    </div>
                </div>
            </div>
        `;

        const marker = L.marker([lat, lng], { icon: goldIcon })
            .bindPopup(popupHtml, { minWidth: 250 })
            .addTo(markerLayerGroup);

        // Highlight pin on hover
        marker.on('mouseover', function () {
            this.openPopup();
        });
    });

    // Fit map bounds to show all plotted coordinate markers
    if (bounds.length > 0) {
        mapInstance.fitBounds(bounds, { padding: [50, 50] });
    }
}

export function focusMapOnCoordinates(lat, lng, zoom = 14) {
    if (mapInstance) {
        mapInstance.setView([lat, lng], zoom, {
            animate: true,
            duration: 1.2
        });
    }
}
