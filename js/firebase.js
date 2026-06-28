/* js/firebase.js - Firebase Initialization & Services Configuration */

// Firebase SDK Configuration Structure
const firebaseConfig = {
    apiKey: "AIzaSyDummyKeyForPortfolioShowcaseClickThrough",
    authDomain: "luxehaven-luxury.firebaseapp.com",
    projectId: "luxehaven-luxury",
    storageBucket: "luxehaven-luxury.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Check if firebase is loaded from script CDNs
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

export function initFirebase() {
    if (typeof firebase !== 'undefined') {
        try {
            // Initialize Firebase App
            firebaseApp = firebase.initializeApp(firebaseConfig);
            firebaseAuth = firebase.auth();
            firebaseDb = firebase.firestore();
            console.log("LuxeHaven Firebase Services Initialized Successfully.");
            return true;
        } catch (e) {
            console.warn("Firebase CDN loaded, but credentials failed to initialize.", e);
        }
    } else {
        console.log("Firebase CDN not loaded. Running in local storage fallback mode.");
    }
    return false;
}

export function getFirebaseAuth() {
    return firebaseAuth;
}

export function getFirebaseDb() {
    return firebaseDb;
}
