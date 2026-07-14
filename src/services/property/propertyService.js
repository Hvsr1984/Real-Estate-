/* js/services/property/propertyService.js - Property Services Domain */

import { databaseService } from '../databaseService.js';
import { PropertyRepository } from '../../database/repositories/PropertyRepository.js';
import { BaseRepository } from '../../database/repositories/BaseRepository.js';
import { COLLECTIONS, SUBMISSION_STATUSES } from '../../config/constants.js';
import { eventBus } from '../../core/eventBus.js';

export class PropertyService {
    constructor() {
        const adapter = databaseService.getAdapter();
        this.propertyRepo = new PropertyRepository(adapter);
        this.submissionRepo = new BaseRepository(adapter, COLLECTIONS.SUBMISSIONS);
        this.versionRepo = new BaseRepository(adapter, COLLECTIONS.VERSIONS);
    }

    async getApprovedProperties() {
        return this.propertyRepo.findApproved();
    }

    async getFeaturedProperties() {
        return this.propertyRepo.findFeatured();
    }

    async getPropertyById(id) {
        return this.propertyRepo.findById(id);
    }

    async submitProperty(propertyData) {
        const submission = {
            ...propertyData,
            status: SUBMISSION_STATUSES.PENDING,
            submittedAt: new Date().toISOString()
        };
        const record = await this.submissionRepo.create(submission);
        eventBus.emit('property.submitted', record);
        return record;
    }

    async updateSubmission(id, updateData) {
        return this.submissionRepo.update(id, updateData);
    }

    async getSubmissionsByStatus(status) {
        return this.submissionRepo.query([
            { field: 'status', operator: '==', value: status }
        ]);
    }

    async getAllSubmissions() {
        return this.submissionRepo.getAll();
    }

    async approveSubmission(id, editorName = 'System Admin') {
        const submission = await this.submissionRepo.findById(id);
        if (!submission) throw new Error("Submission not found.");

        // Update submission status to Approved
        await this.submissionRepo.update(id, { status: SUBMISSION_STATUSES.APPROVED });

        // Add to main properties collection
        const propertyRecord = {
            ...submission,
            id, // Keep the same ID
            moderationStatus: SUBMISSION_STATUSES.APPROVED,
            approvedAt: new Date().toISOString(),
            approvedBy: editorName
        };
        
        // Remove submission specific fields if necessary
        delete propertyRecord.submittedAt;

        // Check if property already exists in public grid
        const existing = await this.propertyRepo.findById(id);
        if (existing) {
            await this.saveVersion(id, editorName, "Properties approved & overwritten");
            await this.propertyRepo.update(id, propertyRecord);
        } else {
            await this.propertyRepo.create(propertyRecord);
        }

        // Emit Decoupled Approval Event
        eventBus.emit('property.approved', propertyRecord);
        return propertyRecord;
    }

    async rejectSubmission(id, reason = '') {
        const record = await this.submissionRepo.update(id, { 
            status: SUBMISSION_STATUSES.REJECTED,
            rejectionReason: reason
        });
        eventBus.emit('property.rejected', record);
        return record;
    }

    async deleteProperty(id, editorName = 'System Admin') {
        await this.saveVersion(id, editorName, "Property deleted (Archived in history)");
        await this.propertyRepo.delete(id);
        eventBus.emit('property.deleted', { id });
        return true;
    }

    /* ==========================================================================
       VERSION CONTROL / LISTINGS HISTORY
       ========================================================================== */
    async saveVersion(propertyId, editorName, description = 'Listing updated') {
        const property = await this.propertyRepo.findById(propertyId);
        if (!property) return null;

        const versionRecord = {
            propertyId,
            editor: editorName,
            timestamp: new Date().toISOString(),
            description,
            dataSnapshot: JSON.parse(JSON.stringify(property))
        };
        return this.versionRepo.create(versionRecord);
    }

    async getVersionHistory(propertyId) {
        const history = await this.versionRepo.query([
            { field: 'propertyId', operator: '==', value: propertyId }
        ]);
        // Sort history by timestamp descending
        return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    async restoreVersion(propertyId, versionId, editorName = 'System Admin') {
        const version = await this.versionRepo.findById(versionId);
        if (!version) throw new Error("Version record not found.");

        // Save current state before rollback
        await this.saveVersion(propertyId, editorName, `Pre-rollback snapshot`);

        // Restore property values
        const restoredData = {
            ...version.dataSnapshot,
            id: propertyId,
            restoredAt: new Date().toISOString(),
            restoredBy: editorName
        };
        await this.propertyRepo.update(propertyId, restoredData);

        eventBus.emit('property.restored', restoredData);
        return restoredData;
    }
}

export const propertyService = new PropertyService();
