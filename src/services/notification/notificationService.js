/* js/services/notification/notificationService.js - Notification Domain */

import { databaseService } from '../databaseService.js';
import { NotificationRepository } from '../../database/repositories/NotificationRepository.js';
import { eventBus } from '../../core/eventBus.js';
import { showToast } from '../app.js';

export class NotificationService {
    constructor() {
        const adapter = databaseService.getAdapter();
        this.notificationRepo = new NotificationRepository(adapter);
        this.bindGlobalEvents();
    }

    bindGlobalEvents() {
        // Automatically respond to decoupled PubSub events
        eventBus.on('property.submitted', (record) => {
            this.createAdminNotification(
                'New Submission Received', 
                `Residence "${record.title}" is pending curatorship review.`
            );
            showToast(`Submission logged successfully! Pending review.`, 'success');
        });

        eventBus.on('property.approved', (record) => {
            this.createUserNotification(
                record.email || 'client@domain.com',
                'Residence Curatorship Approved',
                `Congratulations! "${record.title}" is now active in public showroom listings.`
            );
            showToast(`Listing "${record.title}" approved & published!`, 'success');
        });

        eventBus.on('property.rejected', (record) => {
            this.createUserNotification(
                record.email || 'client@domain.com',
                'Submission Rejection Notification',
                `Residences proposal "${record.title}" review not approved: ${record.rejectionReason || 'Details mismatch'}`
            );
            showToast(`Listing submission rejected.`, 'warning');
        });

        eventBus.on('booking.created', (record) => {
            this.createAdminNotification(
                'Viewing Appointment Scheduled',
                `Client "${record.name}" registered appointment tour for listing: ${record.propertyTitle || record.propertyId}`
            );
            showToast(`Viewing request registered! Confirmation dispatched.`, 'success');
        });
    }

    async createNotification(data) {
        const record = await this.notificationRepo.create({
            ...data,
            read: false,
            timestamp: new Date().toISOString()
        });
        eventBus.emit('notification.created', record);
        return record;
    }

    async createAdminNotification(title, message) {
        return this.createNotification({
            scope: 'admin',
            title,
            message
        });
    }

    async createUserNotification(userEmail, title, message) {
        return this.createNotification({
            scope: 'user',
            userEmail,
            title,
            message
        });
    }

    async getNotifications() {
        return this.notificationRepo.getAll();
    }

    async markAsRead(id) {
        return this.notificationRepo.update(id, { read: true });
    }
}

export const notificationService = new NotificationService();
