/* js/core/jobQueue.js - Asynchronous Background Job Queue */

class JobQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
    }

    static getInstance() {
        if (!JobQueue.instance) {
            JobQueue.instance = new JobQueue();
        }
        return JobQueue.instance;
    }

    /**
     * Add a job to the background queue.
     * @param {string} name - Name of the task
     * @param {function(progress: number): Promise} taskFn - The actual async job. Can receive progress update callback.
     * @param {function(progress: number)} onProgress - Callback triggered when progress updates (0-100)
     */
    add(name, taskFn, onProgress = null) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                name,
                taskFn,
                onProgress,
                resolve,
                reject
            });
            this.processNext();
        });
    }

    async processNext() {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;

        const job = this.queue.shift();
        console.log(`[JobQueue] Starting job: ${job.name}`);

        try {
            const progressCallback = (pct) => {
                if (job.onProgress) {
                    try {
                        job.onProgress(Math.min(100, Math.max(0, Math.round(pct))));
                    } catch (e) {
                        console.error(`[JobQueue] Progress callback error on job "${job.name}":`, e);
                    }
                }
            };

            // Yield thread for browser layout rendering
            await new Promise(resolve => setTimeout(resolve, 30));
            progressCallback(0);

            const result = await job.taskFn(progressCallback);
            progressCallback(100);
            job.resolve(result);
        } catch (error) {
            console.error(`[JobQueue] Job "${job.name}" failed:`, error);
            job.reject(error);
        } finally {
            this.isProcessing = false;
            this.processNext();
        }
    }
}

export default JobQueue;
export const jobQueue = JobQueue.getInstance();
