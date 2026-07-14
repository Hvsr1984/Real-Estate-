/* js/database/repositories/UserRepository.js - User Repository */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../../config/constants.js';

export class UserRepository extends BaseRepository {
    constructor(adapter) {
        super(adapter, COLLECTIONS.USERS);
    }
}
export default UserRepository;
