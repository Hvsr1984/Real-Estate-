/* js/database/repositories/ReviewRepository.js - Review Repository */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../../config/constants.js';

export class ReviewRepository extends BaseRepository {
    constructor(adapter) {
        super(adapter, COLLECTIONS.REVIEWS);
    }
}
export default ReviewRepository;
