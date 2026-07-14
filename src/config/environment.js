/* js/config/environment.js - Dynamic Config & Environment Manager */

export async function getGoogleMapsApiKey() {
    let key = localStorage.getItem('GOOGLE_MAPS_API_KEY');
    if (key) return key;

    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            const data = await response.json();
            if (data.googleMapsApiKey) {
                localStorage.setItem('GOOGLE_MAPS_API_KEY', data.googleMapsApiKey);
                return data.googleMapsApiKey;
            }
        }
    } catch (e) {
        console.warn("Unable to fetch configuration from /api/config. Using environment fallback.");
    }
    return window.ENV?.GOOGLE_MAPS_API_KEY || '';
}

export function getGeminiApiKey() {
    return localStorage.getItem('GEMINI_API_KEY') || window.ENV?.GEMINI_API_KEY || '';
}

export function getFirebaseConfig() {
    return {
        apiKey: localStorage.getItem('FIREBASE_API_KEY') || window.ENV?.FIREBASE_API_KEY || "AIzaSyDummyKeyForPortfolioShowcaseClickThrough",
        authDomain: "luxehaven-luxury.firebaseapp.com",
        projectId: "luxehaven-luxury",
        storageBucket: "luxehaven-luxury.appspot.com",
        messagingSenderId: "123456789012",
        appId: "1:123456789012:web:abcdef1234567890"
    };
}
