/* js/database/repositories/AgentRepository.js - Agent Repository */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../../config/constants.js';

export class AgentRepository extends BaseRepository {
    constructor(adapter) {
        super(adapter, COLLECTIONS.AGENTS);
    }
}
export default AgentRepository;
