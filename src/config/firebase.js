/* js/config/firebase.js - Firebase Initialization configuration */

import { getFirebaseConfig } from './environment.js';

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let firebaseStorage = null;

export function initializeFirebase() {
    if (typeof firebase !== 'undefined') {
        const config = getFirebaseConfig();
        // Check if configuration uses dummy keys
        if (config.apiKey && !config.apiKey.includes('Dummy')) {
            try {
                if (!firebase.apps.length) {
                    firebaseApp = firebase.initializeApp(config);
                } else {
                    firebaseApp = firebase.app();
                }
                firebaseAuth = firebase.auth();
                firebaseDb = firebase.firestore();
                if (firebase.storage) {
                    firebaseStorage = firebase.storage();
                }
                console.log("Enterprise Firebase Adapters Initialized Successfully.");
                return true;
            } catch (error) {
                console.warn("Firebase CDN loaded, but credentials failed to initialize.", error);
            }
        } else {
            console.log("Firebase initialized in Local Mock mode (Dummy credentials detected).");
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

export function getFirebaseStorage() {
    return firebaseStorage;
}
