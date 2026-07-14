/* js/database/repositories/BaseRepository.js - Generic Repository Base Class */

export class BaseRepository {
    constructor(adapter, collectionName) {
        if (!adapter) {
            throw new Error(`Repository initialized without a storage adapter.`);
        }
        this.adapter = adapter;
        this.collectionName = collectionName;
    }

    async create(data) {
        return this.adapter.create(this.collectionName, data);
    }

    async update(id, data) {
        return this.adapter.update(this.collectionName, id, data);
    }

    async delete(id) {
        return this.adapter.delete(this.collectionName, id);
    }

    async findById(id) {
        return this.adapter.findById(this.collectionName, id);
    }

    async getAll() {
        return this.adapter.getAll(this.collectionName);
    }

    async query(criteria = []) {
        return this.adapter.query(this.collectionName, criteria);
    }

    async paginate(page = 1, limit = 10, criteria = []) {
        return this.adapter.paginate(this.collectionName, page, limit, criteria);
    }

    async search(keyword, fields = []) {
        return this.adapter.search(this.collectionName, keyword, fields);
    }
}
export default BaseRepository;
