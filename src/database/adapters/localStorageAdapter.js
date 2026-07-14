/* js/database/adapters/localStorageAdapter.js - Browser LocalStorage Adapter */

import { DatabaseAdapter } from './databaseAdapter.js';

export class LocalStorageAdapter extends DatabaseAdapter {
    constructor() {
        super();
        this.seedInitialData();
    }

    async seedInitialData() {
        const propKey = 'properties_db';
        const builderKey = 'builders_db';
        
        let existingProps = localStorage.getItem(propKey);
        if (existingProps) {
            // Self-healing check: clean up US demo data if found
            if (existingProps.includes('Beverly Hills') || existingProps.includes('Miami') || existingProps.includes('Tokyo')) {
                localStorage.removeItem(propKey);
                localStorage.removeItem(builderKey);
                localStorage.removeItem('wishlist');
                localStorage.removeItem('recently_viewed');
                localStorage.removeItem('compare');
                existingProps = null;
            }
        }

        if (!existingProps) {
            try {
                const response = await fetch('../data/properties.json');
                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem(propKey, JSON.stringify(data));
                }
            } catch (e) {
                console.warn("[LocalStorageAdapter] Unable to seed properties database:", e);
            }
        }

        if (!localStorage.getItem(builderKey)) {
            try {
                const response = await fetch('../data/builders.json');
                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem(builderKey, JSON.stringify(data));
                }
            } catch (e) {
                console.warn("[LocalStorageAdapter] Unable to seed builders database:", e);
            }
        }
    }

    _getDbKey(collection) {
        return `${collection}_db`;
    }

    _read(collection) {
        const key = this._getDbKey(collection);
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    _write(collection, data) {
        const key = this._getDbKey(collection);
        localStorage.setItem(key, JSON.stringify(data));
    }

    async create(collection, data) {
        const records = this._read(collection);
        const id = data.id || `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const record = { ...data, id };
        records.push(record);
        this._write(collection, records);
        return record;
    }

    async update(collection, id, data) {
        const records = this._read(collection);
        const index = records.findIndex(r => r.id === id);
        if (index === -1) {
            throw new Error(`Record with ID ${id} not found in collection ${collection}`);
        }
        records[index] = { ...records[index], ...data };
        this._write(collection, records);
        return records[index];
    }

    async delete(collection, id) {
        const records = this._read(collection);
        const filtered = records.filter(r => r.id !== id);
        this._write(collection, filtered);
        return true;
    }

    async findById(collection, id) {
        const records = this._read(collection);
        return records.find(r => r.id === id) || null;
    }

    async getAll(collection) {
        return this._read(collection);
    }

    async query(collection, criteria = []) {
        const records = this._read(collection);
        return records.filter(record => {
            return criteria.every(crit => {
                const fieldVal = record[crit.field];
                switch (crit.operator) {
                    case '==':
                        return fieldVal === crit.value;
                    case '!=':
                        return fieldVal !== crit.value;
                    case '>':
                        return fieldVal > crit.value;
                    case '<':
                        return fieldVal < crit.value;
                    case '>=':
                        return fieldVal >= crit.value;
                    case '<=':
                        return fieldVal <= crit.value;
                    case 'array-contains':
                        return Array.isArray(fieldVal) && fieldVal.includes(crit.value);
                    default:
                        return fieldVal === crit.value;
                }
            });
        });
    }

    async paginate(collection, page = 1, limit = 10, criteria = []) {
        const matched = await this.query(collection, criteria);
        const total = matched.length;
        const start = (page - 1) * limit;
        const data = matched.slice(start, start + limit);

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
        const records = this._read(collection);
        if (!keyword) return records;
        const normalized = keyword.toLowerCase();

        return records.filter(record => {
            return fields.some(field => {
                const val = record[field];
                if (val === undefined || val === null) return false;
                return String(val).toLowerCase().includes(normalized);
            });
        });
    }
}
