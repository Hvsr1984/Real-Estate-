/* src/services/databaseService.js - Database Service Registry singleton */

import { FEATURE_FLAGS } from '../config/featureFlags.js';
import { initializeFirebase } from '../config/firebase.js';
import { FirestoreAdapter } from '../database/adapters/firestoreAdapter.js';
import { LocalStorageAdapter } from '../database/adapters/localStorageAdapter.js';

class DatabaseService {
    constructor() {
        // Attempt firebase init first
        const isFirebaseReady = initializeFirebase();

        if (isFirebaseReady && FEATURE_FLAGS.USE_FIRESTORE) {
            this.adapter = new FirestoreAdapter();
            console.log("[DatabaseService] Running in Cloud Firestore mode.");
        } else {
            this.adapter = new LocalStorageAdapter();
            console.log("[DatabaseService] Running in LocalStorage cache mode.");
        }
    }

    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    getAdapter() {
        return this.adapter;
    }
}

export default DatabaseService;
export const databaseService = DatabaseService.getInstance();
