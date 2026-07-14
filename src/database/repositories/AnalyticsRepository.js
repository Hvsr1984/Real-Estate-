/* js/database/repositories/AnalyticsRepository.js - Analytics Repository */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../../config/constants.js';

export class AnalyticsRepository extends BaseRepository {
    constructor(adapter) {
        super(adapter, COLLECTIONS.ANALYTICS);
    }

    /**
     * Increments a specific analytics counter for a property.
     */
    async increment(propertyId, field) {
        let stats = await this.findById(propertyId);
        if (!stats) {
            stats = {
                id: propertyId,
                views: 0,
                uniqueVisitors: 0,
                wishlistAdds: 0,
                contactClicks: 0,
                bookingClicks: 0,
                galleryViews: 0,
                mapClicks: 0,
                shareCount: 0,
                totalTimeSeconds: 0
            };
            stats[field] = 1;
            return this.create(stats);
        } else {
            stats[field] = (stats[field] || 0) + 1;
            return this.update(propertyId, stats);
        }
    }

    /**
     * Add time on page to total tracked duration.
     */
    async addTime(propertyId, seconds) {
        let stats = await this.findById(propertyId);
        if (!stats) {
            stats = {
                id: propertyId,
                views: 1,
                uniqueVisitors: 1,
                wishlistAdds: 0,
                contactClicks: 0,
                bookingClicks: 0,
                galleryViews: 0,
                mapClicks: 0,
                shareCount: 0,
                totalTimeSeconds: seconds
            };
            return this.create(stats);
        } else {
            stats.totalTimeSeconds = (stats.totalTimeSeconds || 0) + seconds;
            return this.update(propertyId, stats);
        }
    }
}
export default AnalyticsRepository;
