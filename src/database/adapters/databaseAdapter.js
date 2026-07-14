/* js/database/adapters/databaseAdapter.js - Base Storage Adapter Interface */

export class DatabaseAdapter {
    /**
     * Create a record in the specified collection.
     */
    async create(collection, data) {
        throw new Error("create() method must be implemented by concrete database adapters.");
    }

    /**
     * Update an existing record in the specified collection.
     */
    async update(collection, id, data) {
        throw new Error("update() method must be implemented by concrete database adapters.");
    }

    /**
     * Delete a record by ID from the specified collection.
     */
    async delete(collection, id) {
        throw new Error("delete() method must be implemented by concrete database adapters.");
    }

    /**
     * Find a record by its unique ID in the specified collection.
     */
    async findById(collection, id) {
        throw new Error("findById() method must be implemented by concrete database adapters.");
    }

    /**
     * Get all records from a collection.
     */
    async getAll(collection) {
        throw new Error("getAll() method must be implemented by concrete database adapters.");
    }

    /**
     * Query a collection with criteria.
     * Criteria format: array of objects { field, operator, value }
     */
    async query(collection, criteria) {
        throw new Error("query() method must be implemented by concrete database adapters.");
    }

    /**
     * Paginate records from a collection.
     */
    async paginate(collection, page, limit, criteria = []) {
        throw new Error("paginate() method must be implemented by concrete database adapters.");
    }

    /**
     * Basic string query search.
     */
    async search(collection, keyword, fields) {
        throw new Error("search() method must be implemented by concrete database adapters.");
    }
}
