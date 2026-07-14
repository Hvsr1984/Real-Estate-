/* js/services/analytics/analyticsService.js - Analytics Service Domain */

import { databaseService } from '../databaseService.js';
import { AnalyticsRepository } from '../../database/repositories/AnalyticsRepository.js';

export class AnalyticsService {
    constructor() {
        const adapter = databaseService.getAdapter();
        this.analyticsRepo = new AnalyticsRepository(adapter);
    }

    /**
     * Increment views and unique visitors (if first time).
     */
    async trackPageView(propertyId) {
        if (!propertyId) return;

        // Unique visitor check using cookie-like localStorage session IDs
        const key = `visit_${propertyId}`;
        const hasVisited = sessionStorage.getItem(key);

        if (!hasVisited) {
            sessionStorage.setItem(key, 'true');
            await this.analyticsRepo.increment(propertyId, 'uniqueVisitors');
        }

        await this.analyticsRepo.increment(propertyId, 'views');
    }

    /**
     * Increment interaction action logs.
     * Fields: wishlistAdds, contactClicks, bookingClicks, galleryViews, mapClicks, shareCount
     */
    async trackAction(propertyId, actionField) {
        if (!propertyId || !actionField) return;
        await this.analyticsRepo.increment(propertyId, actionField);
    }

    /**
     * Increment total duration spend on page.
     */
    async trackTimeOnPage(propertyId, seconds) {
        if (!propertyId || seconds <= 0) return;
        await this.analyticsRepo.addTime(propertyId, seconds);
    }

    async getPropertyStats(propertyId) {
        return this.analyticsRepo.findById(propertyId);
    }

    async getAllStats() {
        return this.analyticsRepo.getAll();
    }
}

export const analyticsService = new AnalyticsService();
