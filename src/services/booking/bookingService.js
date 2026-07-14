/* js/services/booking/bookingService.js - Booking Service Domain */

import { databaseService } from '../databaseService.js';
import { BookingRepository } from '../../database/repositories/BookingRepository.js';
import { eventBus } from '../../core/eventBus.js';

export class BookingService {
    constructor() {
        const adapter = databaseService.getAdapter();
        this.bookingRepo = new BookingRepository(adapter);
    }

    async createBooking(bookingData) {
        // Validation checks
        if (!bookingData.name || !bookingData.email || !bookingData.phone || !bookingData.date) {
            throw new Error("Missing required fields for viewing schedule.");
        }

        const record = await this.bookingRepo.create({
            ...bookingData,
            status: 'Confirmed',
            createdAt: new Date().toISOString()
        });

        eventBus.emit('booking.created', record);
        return record;
    }

    async getBookings() {
        return this.bookingRepo.getAll();
    }
}

export const bookingService = new BookingService();
