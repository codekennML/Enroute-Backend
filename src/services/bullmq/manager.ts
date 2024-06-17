import { Worker, Queue, Job } from "bullmq";
import { QueueLogger } from "../../middlewares/logging/logger";
import   { RedisOptions}   from "ioredis"

const UPSTASH_REDIS_URL  =  process.env.UPSTASH_REDIS_SERVER_URL as string 

const UPSTASH_REDIS_PASSWORD =  process.env.UPSTASH_REDIS_PASSWORD  as string

const redisOptions: RedisOptions = {
    port: 6379,
    host: UPSTASH_REDIS_URL,
    // password:UPSTASH_REDIS_PASSWORD ,
    tls  : {},
    // db: 0,
    maxRetriesPerRequest: null
};


export class QueueManager<T> {
    private workers: Worker[] = [];
    private queue: Queue<T>;
    private connection: RedisOptions

    constructor(queueName: string ) {
        if (!queueName) {
            throw new Error('QueueName is required');
        }
        this.connection =  redisOptions
        this.queue = new Queue(queueName, {connection : this.connection})
       
    }
    
    getQueue() { 
        return this.queue
    }

    async startWorkers(concurrency: number, count: number, processor: (data: T ) => Promise<void> | void) {
        for (let i = 0; i < count; i++) {
            const worker = new Worker<T>(
                this.queue.name,
                async (job: Job<T>) => {
                    try {
                        if (!job ) throw new Error("No job data found for processing");

                      
                            await processor(job.data)
                       


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

export default QueueManager;
