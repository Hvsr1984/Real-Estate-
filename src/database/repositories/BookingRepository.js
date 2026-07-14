/* js/database/repositories/BookingRepository.js - Booking Repository */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../../config/constants.js';

export class BookingRepository extends BaseRepository {
    constructor(adapter) {
        super(adapter, COLLECTIONS.BOOKINGS);
    }
}
export default BookingRepository;
