/* js/config/googleMaps.js - Google Maps styling & Options config */

export const GOOGLE_MAPS_DARK_STYLE = [
    { elementType: "geometry", stylers: [{ color: "#0B0F19" }] }, // Deep slate background
    { elementType: "labels.text.stroke", stylers: [{ color: "#0B0F19" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8B95A5" }] }, // Subdued text
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#C9A96E" }] // Gold details for cities
    },
    {
        featureType: "poi",
        elementType: "all",
        stylers: [{ visibility: "off" }] // Hide default POIs to keep layout minimal
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#172132" }]
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#0D1522" }]
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#606F89" }]
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#23334D" }]
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#172132" }]
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#8B95A5" }]
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#172132" }]
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#C9A96E" }] // Gold transit text
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#05070C" }] // Dark water
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#2D3E50" }]
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#05070C" }]
    }
];

export const GOOGLE_MAPS_OPTIONS = {
    styles: GOOGLE_MAPS_DARK_STYLE,
    gestureHandling: "cooperative", // Mobile friendly two-finger touch
    disableDefaultUI: true,
    zoomControl: true,
    fullscreenControl: false,
    mapTypeControl: false,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: false
};
