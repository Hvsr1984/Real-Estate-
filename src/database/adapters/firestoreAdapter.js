/* js/database/adapters/firestoreAdapter.js - Firebase Firestore Adapter */

import { DatabaseAdapter } from './databaseAdapter.js';
import { getFirebaseDb } from '../../config/firebase.js';

export class FirestoreAdapter extends DatabaseAdapter {
    get db() {
        const dbInstance = getFirebaseDb();
        if (!dbInstance) {
            throw new Error("Firestore instance not initialized. Check configurations.");
        }
        return dbInstance;
    }

    async create(collection, data) {
        const id = data.id || this.db.collection(collection).doc().id;
        const record = { ...data, id };
        await this.db.collection(collection).doc(id).set(record);
        return record;
    }

    async update(collection, id, data) {
        await this.db.collection(collection).doc(id).update(data);
        return this.findById(collection, id);
    }

    async delete(collection, id) {
        await this.db.collection(collection).doc(id).delete();
        return true;
    }

    async findById(collection, id) {
        const doc = await this.db.collection(collection).doc(id).get();
        return doc.exists ? doc.data() : null;
    }

    async getAll(collection) {
        const snapshot = await this.db.collection(collection).get();
        return snapshot.docs.map(doc => doc.data());
    }

    async query(collection, criteria = []) {
        let queryRef = this.db.collection(collection);
        criteria.forEach(crit => {
            queryRef = queryRef.where(crit.field, crit.operator, crit.value);
        });
        const snapshot = await queryRef.get();
        return snapshot.docs.map(doc => doc.data());
    }

    async paginate(collection, page = 1, limit = 10, criteria = []) {
        let queryRef = this.db.collection(collection);
        criteria.forEach(crit => {
            queryRef = queryRef.where(crit.field, crit.operator, crit.value);
        });
        
        // Count total matching records
        const allDocs = await queryRef.get();
        const total = allDocs.size;
        
        // Simple client-side page offset to keep database generic
        const data = allDocs.docs
            .map(doc => doc.data())
            .slice((page - 1) * limit, page * limit);

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async search(collection, keyword, fields = []) {
        const allRecords = await this.getAll(collection);
        if (!keyword) return allRecords;
        const normalized = keyword.toLowerCase();
        
        return allRecords.filter(record => {
            return fields.some(field => {
                const val = record[field];
                if (val === undefined || val === null) return false;
                return String(val).toLowerCase().includes(normalized);
            });
        });
    }
}
