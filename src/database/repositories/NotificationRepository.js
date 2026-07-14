/* js/database/repositories/NotificationRepository.js - Notification Repository */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../../config/constants.js';

export class NotificationRepository extends BaseRepository {
    constructor(adapter) {
        super(adapter, COLLECTIONS.NOTIFICATIONS);
    }
}
export default NotificationRepository;
