import { Worker, Queue, Job } from "bullmq";
import { QueueLogger } from "../../middlewares/logging/logger";

interface ConnectionOptions {
    host: string;
    port: number;
}

export class WorkerManager<T extends object> {
    private workers: Worker[] = [];
    private queue: Queue<T>;
    private connection: ConnectionOptions;

    constructor(queue: Queue<T>) {
        if (!queue) {
            throw new Error('Queue is required');
        }

        this.queue = queue;
        this.connection = {
            host: "rediss://default:AY6mAAIncDE3NDc1MzA4N2QyMjQ0Nzg5OTgwYTMyNWQwOTJkZjk5ZXAxMzY1MTg@secure-doberman-36518.upstash.io",
            port: 6379
        };
    }

    async startWorker(concurrency: number, count: number, processor: (data: T) => Promise<void> | void) {
        for (let i = 0; i < count; i++) {
            const worker = new Worker<T>(
                this.queue.name,
                async (job: Job<T>) => {
                    try {
                        if (!job || !job.data) throw new Error("No job data found for processing");
                        await processor(job.data);
                    } catch (e: unknown) {
                        QueueLogger.error(`Queue error: Queue name - ${this.queue.name}, error - ${(e as Error).message}`);
                    }
                },
                { concurrency, connection: this.connection }
            );

            this.workers.push(worker);

            worker.on("completed", (job) => {
                console.log(`Job ${job.id} has been completed`);
            });

            worker.on("failed", (job, err) => {
                console.error(`Job ${job?.id} has failed: ${err.message}`);
            });

            console.log(`Worker ${i + 1} for ${this.queue.name} started`);
        }
    }

    async stopWorkers() {
        for (const worker of this.workers) {
            await worker.close();
        }

        this.workers = [];
        console.log(`All workers for ${this.queue.name} stopped`);
    }
}

export default WorkerManager;
