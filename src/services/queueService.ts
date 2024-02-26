import { Queue, Worker } from "bullmq";

class JobQueue<T> {
  private queue: Queue;

  constructor(queueName: string, concurrency: number = 1) {
    this.queue = new Queue(queueName);
    this.initializeWorkers(concurrency);
  }

  private initializeWorkers(concurrency: number) {
    for (let i = 0; i < concurrency; i++) {
      const worker = new Worker(this.queue.name, async (job) => {
        // Process the job here
        console.log(
          `Worker ${i + 1} processing job ${job.id} with data:`,
          job.data
        );
        return job.data; // You can return a result if needed
      });

      worker.on("completed", (job) => {
        // Handle completed job event
        console.log(`Job ${job.id} completed successfully`);
      });

      // Add more event handlers and options as needed
    }
  }

  async addJob(data: T) {
    // Add a new job to the queue
    await this.queue.add(data, { attempts: 1 });
  }

  async addBulkJob(data: T) {
    await this.queue.addBulk(data);
  }
}

export default JobQueue;
