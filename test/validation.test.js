/* test/validation.test.js - Self-diagnostic tests suite */

import { eventBus } from '../src/core/eventBus.js';
import { jobQueue } from '../src/core/jobQueue.js';
import { searchService } from '../src/services/search/searchService.js';
import { databaseService } from '../src/services/databaseService.js';

export async function runSelfDiagnostics() {
    console.log("=========================================");
    console.log("       LUXEHAVEN V6 SELF-DIAGNOSTICS     ");
    console.log("=========================================");
    
    let passed = 0;
    let failed = 0;

    const assert = (name, assertion) => {
        if (assertion) {
            console.log(`%c[PASS] ${name}`, 'color: #10B981; font-weight: bold;');
            passed++;
        } else {
            console.error(`[FAIL] ${name}`);
            failed++;
        }
    };

    // 1. EVENT BUS TESTS
    try {
        let triggerVal = null;
        const unsub = eventBus.on('test.event', (data) => { triggerVal = data; });
        eventBus.emit('test.event', 'verified_token');
        assert("EventBus subscription triggers on emit", triggerVal === 'verified_token');
        
        unsub();
        eventBus.emit('test.event', 'ignored_token');
        assert("EventBus unsubscribes correctly", triggerVal === 'verified_token');
    } catch (e) {
        assert("EventBus tests executed without errors", false);
    }

    // 2. SEARCH SERVICE FUZZY TESTS
    try {
        assert("Fuzzy matches exact substrings", searchService.fuzzyMatch("The Celestial Travertine Villa", "Travertine"));
        assert("Fuzzy matches char sequence in order", searchService.fuzzyMatch("The Celestial Travertine Villa", "Clstl"));
        assert("Fuzzy rejects incorrect order sequence", !searchService.fuzzyMatch("The Celestial Travertine Villa", "tslc"));
    } catch (e) {
        assert("Fuzzy search tests executed without errors", false);
    }

    // 3. DATABASE REPOSITORY TESTS
    try {
        const adapter = databaseService.getAdapter();
        // Create mock record in temp database
        const mockCollection = 'test_assertions';
        const created = await adapter.create(mockCollection, { title: 'Diagnostic Unit', score: 10 });
        assert("Adapter creates record successfully", created.id !== undefined && created.title === 'Diagnostic Unit');

        const fetched = await adapter.findById(mockCollection, created.id);
        assert("Adapter fetches created record by ID", fetched && fetched.score === 10);

        await adapter.update(mockCollection, created.id, { score: 12 });
        const updated = await adapter.findById(mockCollection, created.id);
        assert("Adapter updates record successfully", updated && updated.score === 12);

        await adapter.delete(mockCollection, created.id);
        const deleted = await adapter.findById(mockCollection, created.id);
        assert("Adapter deletes record successfully", deleted === null);
    } catch (e) {
        assert("Database adapters tests executed without errors", false);
    }

    // 4. JOB QUEUE TESTS
    try {
        let executionOrder = [];
        const task1 = () => new Promise(r => setTimeout(() => { executionOrder.push(1); r(); }, 20));
        const task2 = () => new Promise(r => setTimeout(() => { executionOrder.push(2); r(); }, 10));

        await Promise.all([
            jobQueue.add('Task 1', task1),
            jobQueue.add('Task 2', task2)
        ]);

        assert("JobQueue executes tasks in sequential order", executionOrder[0] === 1 && executionOrder[1] === 2);
    } catch (e) {
        assert("JobQueue tests executed without errors", false);
    }

    console.log("=========================================");
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log("=========================================");
}

// Auto-run when URL contains ?run_diagnostics=true
if (window.location.search.includes('run_diagnostics=true')) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(runSelfDiagnostics, 2000);
    });
}
