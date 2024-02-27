import { Job, Queue, Worker, JobsOptions } from "bullmq";
// import { Prettify } from "../../../types/types";

export type QueueRequest<T> = {
  data: T[];
  options?: JobsOptions;
} & { name: string };

class JobQueue<T> {
  private queue: Queue;

  constructor(queueName: string, concurrency: number = 1) {
    this.queue = new Queue(queueName);
    this.initializeWorkers(concurrency);
  }

  private initializeWorkers(concurrency: number) {
    for (let i = 0; i < concurrency; i++) {
      const worker = new Worker(this.queue.name, async (job) => {
        console.log(
          `Worker ${i + 1} processing job ${job.id} with data:`,
          job.data
        );

        await this.processJobs(job);
      });

      worker.on("completed", (job) => {
        // Handle completed job event
        console.log(`Job ${job.id} completed successfully`);
      });

      // Add more event handlers and options as needed
    }
  }

  async addJob(request: QueueRequest<T>) {
    // Add a new job to the queue
    await this.queue.add(request.name, request.data, request.options);
  }

  async addBulkJob(request: QueueRequest<T>[]) {
    await this.queue.addBulk(request);
  }

  protected async processJobs(job: Job) {
    console.log(job.data);
  }
}

export default JobQueue;
