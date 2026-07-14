/* js/services/maps/mapsService.js - Google Maps Integration Service */

import { getGoogleMapsApiKey } from '../../config/environment.js';
import { GOOGLE_MAPS_OPTIONS } from '../../config/googleMaps.js';
import { formatPrice } from '../../utils/formatters.js';

class MapsService {
    constructor() {
        this.loadingPromise = null;
        this.activeMaps = {};
    }

    static getInstance() {
        if (!MapsService.instance) {
            MapsService.instance = new MapsService();
        }
        return MapsService.instance;
    }

    /**
     * Lazy loads the Google Maps JavaScript API script.
     * Caches load instances so multiple components query a single promise.
     */
    async loadGoogleMaps() {
        if (typeof google !== 'undefined' && google.maps) {
            return google.maps;
        }

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = new Promise((resolve, reject) => {
            getGoogleMapsApiKey().then(apiKey => {
                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=__initGoogleMapsCallback&loading=async`;
                script.async = true;
                script.defer = true;

                window.__initGoogleMapsCallback = () => {
                    resolve(google.maps);
                };

                script.onerror = (error) => {
                    this.loadingPromise = null; // Clear on error to allow retry
                    reject(new Error("Network exception. Google Maps API script download failed."));
                };

                document.head.appendChild(script);
            }).catch(error => {
                this.loadingPromise = null;
                reject(error);
            });
        });

        return this.loadingPromise;
    }

    /**
     * Initializes Google Map in a specified DOM element.
     * Gracefully renders retry screens on load failure.
     */
    async initMap(elementId, center = { lat: 19.0760, lng: 72.8777 }, zoom = 11) {
        const container = document.getElementById(elementId);
        if (!container) return null;

        try {
            const maps = await this.loadGoogleMaps();
            const mapInstance = new maps.Map(container, {
                center,
                zoom,
                ...GOOGLE_MAPS_OPTIONS
            });

            this.activeMaps[elementId] = {
                map: mapInstance,
                markers: [],
                clusterer: null,
                userMarker: null
            };

            return mapInstance;
        } catch (error) {
            this.renderErrorState(elementId, error.message, () => this.initMap(elementId, center, zoom));
            return null;
        }
    }

    renderErrorState(elementId, message, retryCallback) {
        const container = document.getElementById(elementId);
        if (!container) return;

        container.innerHTML = `
            <div class="map-error-panel" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; padding:2rem; background:#0B0F19; border:1px solid var(--glass-border); text-align:center; color:#FFF;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem; color:var(--accent-gold); margin-bottom:1.5rem;"></i>
                <h4 style="font-family:var(--font-heading); margin-bottom:0.75rem; text-transform:uppercase;">Map Loading Failed</h4>
                <p style="font-size:0.85rem; color:var(--text-secondary); max-width:280px; margin-bottom:1.5rem; line-height:1.6;">${message}</p>
                <button class="btn-primary" id="map-retry-btn" style="padding:0.6rem 1.5rem; font-size:0.8rem;">Retry Connection <i class="fa-solid fa-rotate-right"></i></button>
            </div>
        `;

        const btn = container.querySelector('#map-retry-btn');
        if (btn && retryCallback) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                container.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--text-secondary); font-size:0.9rem;"><i class="fa-solid fa-spinner fa-spin" style="margin-right:0.5rem;"></i> Restoring coordinates...</div>`;
                retryCallback();
            });
        }
    }

    /**
     * Clear existing markers and plot new custom gold pins.
     */
    plotMarkers(elementId, properties) {
        const state = this.activeMaps[elementId];
        if (!state || !window.google || !google.maps) return;

        // Remove old markers
        state.markers.forEach(m => m.setMap(null));
        state.markers = [];

        if (state.clusterer) {
            state.clusterer.clearMarkers();
        }

        if (!properties || properties.length === 0) return;

        const bounds = new google.maps.LatLngBounds();
        const infoWindow = new google.maps.InfoWindow();

        properties.forEach(prop => {
            if (!prop.coordinates || prop.coordinates.length < 2) return;
            const position = { lat: prop.coordinates[0], lng: prop.coordinates[1] };
            bounds.extend(position);

            const marker = new google.maps.Marker({
                position,
                map: state.map,
                title: prop.title,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 7,
                    fillColor: "#C9A96E", // Gold pin
                    fillOpacity: 1.0,
                    strokeColor: "#05070C",
                    strokeWeight: 2
                }
            });

            // Infowindow template
            const formattedPrice = formatPrice(prop.price, prop.status);

            const popupHtml = `
                <div class="map-popup-card" style="color:#000; padding:0.5rem; font-family:sans-serif; width:200px;">
                    <img src="${prop.images[0]}" alt="${prop.title}" style="width:100%; height:90px; object-fit:cover; border-radius:4px; margin-bottom:0.5rem;">
                    <h5 style="margin:0 0 0.25rem 0; font-size:0.9rem; font-weight:600; color:#111;">${prop.title}</h5>
                    <p style="margin:0 0 0.5rem 0; font-size:0.75rem; color:#666;"><i class="fa-solid fa-location-dot"></i> ${prop.city}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:700; color:#C9A96E; font-size:0.85rem;">${formattedPrice}</span>
                        <a href="property.html?id=${prop.id}" style="font-size:0.75rem; color:#05070C; font-weight:600; text-decoration:none;">Details <i class="fa-solid fa-arrow-right"></i></a>
                    </div>
                </div>
            `;

            marker.addListener('mouseover', () => {
                infoWindow.setContent(popupHtml);
                infoWindow.open(state.map, marker);
            });

            state.markers.push(marker);
        });

        // Initialize Marker Clusterer if CDN loaded
        if (typeof markerClusterer !== 'undefined' && state.markers.length > 0) {
            state.clusterer = new markerClusterer.MarkerClusterer({
                map: state.map,
                markers: state.markers
            });
        }

        // Fit boundaries automatically
        if (properties.length > 0) {
            state.map.fitBounds(bounds);
        }
    }

    /**
     * Centers the map view on a user location marker.
     */
    setUserLocation(elementId, lat, lng) {
        const state = this.activeMaps[elementId];
        if (!state || !window.google || !google.maps) return;

        const position = { lat, lng };

        if (state.userMarker) {
            state.userMarker.setPosition(position);
        } else {
            // Render glowing blue circle representing user coordinates
            state.userMarker = new google.maps.Marker({
                position,
                map: state.map,
                title: "Your Coordinates",
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 9,
                    fillColor: "#3B82F6", // Blue glow
                    fillOpacity: 0.8,
                    strokeColor: "#FFFFFF",
                    strokeWeight: 2
                }
            });
        }

        state.map.setCenter(position);
        state.map.setZoom(13);
    }
}

export const mapsService = MapsService.getInstance();
export default mapsService;
