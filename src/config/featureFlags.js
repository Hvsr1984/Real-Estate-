/* js/config/featureFlags.js - Enterprise Feature Flags */

import { getFirebaseConfig } from './environment.js';

export const FEATURE_FLAGS = {
    // Enable Firestore if API key is valid (does not contain "Dummy" template)
    get USE_FIRESTORE() {
        const config = getFirebaseConfig();
        return config.apiKey && !config.apiKey.includes('Dummy');
    },

    // Enable Google Maps if API key is retrieved
    get USE_GOOGLE_MAPS() {
        const key = localStorage.getItem('GOOGLE_MAPS_API_KEY');
        return !!key;
    },

    // Enable Gemini features if API key is provided
    get USE_GEMINI() {
        const key = localStorage.getItem('GEMINI_API_KEY');
        return !!key;
    },

    // Mock logs for local developer tests
    LOG_AUDITS: true,
    SIMULATE_MAILS: true
};
