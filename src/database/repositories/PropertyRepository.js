/* js/database/repositories/PropertyRepository.js - Property Repository */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../../config/constants.js';

export class PropertyRepository extends BaseRepository {
    constructor(adapter) {
        super(adapter, COLLECTIONS.PROPERTIES);
    }

    async findApproved() {
        return this.query([
            { field: 'moderationStatus', operator: '==', value: 'Approved' }
        ]);
    }

    async findFeatured() {
        return this.query([
            { field: 'featured', operator: '==', value: true },
            { field: 'moderationStatus', operator: '==', value: 'Approved' }
        ]);
    }

    async findByCity(city) {
        return this.query([
            { field: 'city', operator: '==', value: city },
            { field: 'moderationStatus', operator: '==', value: 'Approved' }
        ]);
    }
}
export default PropertyRepository;
