import { Worker } from 'worker_threads';
import os from 'os';
import path from 'path';

type WorkerResult = { success: true, uri: string } | { success: false, error: Error }

// class WorkerPool {
//     private queue: (() => Promise<void>)[] = [];
//     private workers: Worker[] = [];
//     private activeWorkers: number = 0;
//     private maxQueueSize: number;

//     constructor(
//         private workerScript: string,
//         private maxWorkers: number = os.cpus().length,
//         maxQueueSize: number = 100
//     ) {
//         this.maxQueueSize = maxQueueSize;
//         for (let i = 0; i < this.maxWorkers; i++) {
//             this.addNewWorker();
//         }
//     }

//     private addNewWorker() {
//         const worker = new Worker(this.workerScript);
//         console.log(this.workerScript, "WSCRIPT")
//         worker.on('message', (result) => {
//             this.activeWorkers--;
//             this.processQueue();
//         });
//         worker.on('error', (error) => {
//             console.error('Worker error:', error);
//             this.activeWorkers--;
//             this.processQueue();
//         });
//         this.workers.push(worker);
//     }

//     private processQueue() {
//         if (this.queue.length > 0 && this.activeWorkers < this.maxWorkers) {
//             const task = this.queue.shift();
//             if (task) {
//                 this.runTask(task);
//             }
//         }
//     }

//     private async runTask(task: () => Promise<void>) {
//         this.activeWorkers++;
//         await task();
//     }

//     close() {
//         for (const worker of this.workers) {
//             worker.terminate();
//         }
//     }

//     // Here, we explicitly define the result as `WorkerResult`
//     // run(task: (worker: Worker) => Promise<void>): Promise<WorkerResult> {
//     //     return new Promise((resolve, reject) => {
//     //         const taskWrapper = async () => {
//     //             const worker = this.workers.find(w => w.threadId % this.maxWorkers === this.activeWorkers % this.maxWorkers);
//     //             try {
//     //                 // Post the task to the worker
//     //                 await task(worker!);

//     //                 // Listen for the result from the worker
//     //                 worker?.once('message', (message: WorkerResult) => {
//     //                     resolve(message);  // Resolve the worker result
//     //                 });

//     //                 // Listen for errors from the worker
//     //                 worker?.once('error', (error) => {
//     //                     reject(error);  // Reject with worker error
//     //                 });

//     //             } catch (error) {
//     //                 reject(error);  // Handle errors during task execution
//     //             }

//     //         };

//     //         if (this.queue.length < this.maxQueueSize) {
//     //             this.queue.push(taskWrapper);
//     //             this.processQueue();
//     //         } else {
//     //             reject(new Error('Server is busy. Please try again later.'));
//     //         }
//     //     }) as Promise<WorkerResult>;  // Cast the result as `WorkerResult`
//     // }

//     run(task: (worker: Worker) => Promise<void>): Promise<any> {

//         return new Promise((resolve, reject) => {
//             const taskWrapper = async () => {
//                 console.log(this.workers, "WORKERS")
//                 const worker = this.workers.find(w => w.threadId % this.maxWorkers === this.activeWorkers % this.maxWorkers);
//                 if (!worker) {
//                     reject(new Error('No available worker.'));
//                     return;
//                 }

//                 try {
//                     const result = await task(worker);
//                     resolve(result);
//                 } catch (error) {
//                     reject(error);
//                 }
//             };

//             if (this.queue.length < this.maxQueueSize) {
//                 this.queue.push(taskWrapper);
//                 this.processQueue();
//             } else {
//                 reject(new Error('Server is busy. Please try again later.'));
//             }
//         });
//     }

//     getQueueLength(): number {
//         return this.queue.length;
//     }

//     getActiveWorkers(): number {
//         return this.activeWorkers;
//     }
// }

// class WorkerPool {
//     private queue: (() => Promise<void>)[] = [];
//     private workers: Worker[] = [];
//     private activeWorkers: Set<Worker> = new Set();
//     private maxQueueSize: number;

//     constructor(
//         private workerScript: string,
//         private maxWorkers: number = os.cpus().length,
//         maxQueueSize: number = 100
//     ) {
//         this.maxQueueSize = maxQueueSize;
//         for (let i = 0; i < this.maxWorkers; i++) {
//             this.addNewWorker();
//         }
//     }

//     private addNewWorker() {
//         const worker = new Worker(this.workerScript);
//         worker.on('message', (result) => {
//             this.activeWorkers.delete(worker);
//             this.processQueue();
//         });
//         worker.on('error', (error) => {
//             console.error('Worker error:', error);
//             this.activeWorkers.delete(worker);
//             this.processQueue();
//         });
//         this.workers.push(worker);
//     }

//     private processQueue() {
//         if (this.queue.length > 0 && this.activeWorkers.size < this.maxWorkers) {
//             const task = this.queue.shift();
//             if (task) {
//                 this.runTask(task);
//             }
//         }
//     }

//     private async runTask(task: (worker: Worker) => Promise<void>) {
//         const availableWorker = this.workers.find(worker => !this.activeWorkers.has(worker));
//         if (availableWorker) {
//             this.activeWorkers.add(availableWorker);
//             try {
//                 await task(availableWorker);
//             } finally {
//                 this.activeWorkers.delete(availableWorker);
//             }
//         }
//     }

//     run(task: (worker: Worker) => Promise<void>): Promise<any> {

//                 return new Promise((resolve, reject) => {
//                     const taskWrapper = async () => {
//                         console.log(this.workers, "WORKERS")
//                         const worker = this.workers.find(w => w.threadId % this.maxWorkers === this.activeWorkers % this.maxWorkers);
//                         if (!worker) {
//                             reject(new Error('No available worker.'));
//                             return;
//                         }

//                         try {
//                             const result = await task(worker);
//                             resolve(result);
//                         } catch (error) {
//                             reject(error);
//                         }
//                     };

//                     if (this.queue.length < this.maxQueueSize) {
//                         this.queue.push(taskWrapper);
//                         this.processQueue();
//                     } else {
//                         reject(new Error('Server is busy. Please try again later.'));
//                     }
//                 });
//             }

//     close() {
//         for (const worker of this.workers) {
//             worker.terminate();
//         }
//     }

//     run(task: (worker: Worker) => Promise<void>): Promise<any> {
//         return new Promise((resolve, reject) => {
//             const taskWrapper = async () => {
//                 try {
//                     await this.runTask(task);
//                     resolve();
//                 } catch (error) {
//                     reject(error);
//                 }
//             };

//             if (this.queue.length < this.maxQueueSize) {
//                 this.queue.push(taskWrapper);
//                 this.processQueue();
//             } else {
//                 reject(new Error('Server is busy. Please try again later.'));
//             }
//         });
//     }

//     getQueueLength(): number {
//         return this.queue.length;
//     }

//     getActiveWorkers(): number {
//         return this.activeWorkers.size;
//     }
// }


// class WorkerPool {
//     private queue: (() => Promise<void>)[] = [];
//     private workers: Worker[] = [];
//     private activeWorkers: Set<Worker> = new Set();
//     private maxQueueSize: number;

//     constructor(
//         private workerScript: string,
//         private maxWorkers: number = os.cpus().length,
//         maxQueueSize: number = 100
//     ) {
//         this.maxQueueSize = maxQueueSize;
//         for (let i = 0; i < this.maxWorkers; i++) {
//             this.addNewWorker();
//         }
//     }

//     private addNewWorker() {
//         const worker = new Worker(this.workerScript);
//         worker.on('message', (result) => {
//             this.activeWorkers.delete(worker);
//             this.processQueue();
//         });
//         worker.on('error', (error) => {
//             console.error('Worker error:', error);
//             this.activeWorkers.delete(worker);
//             this.processQueue();
//         });
//         this.workers.push(worker);
//     }

//     private processQueue() {
//         if (this.queue.length > 0 && this.activeWorkers.size < this.maxWorkers) {
//             const task = this.queue.shift();
//             if (task) {
//                 this.runTask(task);
//             }
//         }
//     }

//     private async runTask(task: (worker: Worker) => Promise<void>) {
//         const availableWorker = this.workers.find(worker => !this.activeWorkers.has(worker));
//         if (availableWorker) {
//             this.activeWorkers.add(availableWorker);
//             try {
//                 await task(availableWorker);
//             } finally {
//                 this.activeWorkers.delete(availableWorker);
//             }
//         }
//     }

//     close() {
//         for (const worker of this.workers) {
//             worker.terminate();
//         }
//     }

//     run(task: (worker: Worker) => Promise<void>): Promise<any> {
//         return new Promise((resolve, reject) => {
//             const taskWrapper = async () => {
//                 try {
//                 await this.runTask(task);

//                     resolve();
//                 } catch (error) {
//                     reject(error);
//                 }
//             };

//             if (this.queue.length < this.maxQueueSize) {
//                 this.queue.push(taskWrapper);
//                 this.processQueue();
//             } else {
//                 reject(new Error('Server is busy. Please try again later.'));
//             }
//         });
//     }

//     getQueueLength(): number {
//         return this.queue.length;
//     }

//     getActiveWorkers(): number {
//         return this.activeWorkers.size;
//     }
// }

class WorkerPool {
    private queue: ((worker: Worker) => Promise<any>)[] = [];
    private workers: Worker[] = [];
    private activeWorkers: Set<Worker> = new Set();
    private maxQueueSize: number;

    constructor(
        private workerScript: string,
        private maxWorkers: number = os.cpus().length,
        maxQueueSize: number = 100
    ) {
        this.maxQueueSize = maxQueueSize;
        for (let i = 0; i < this.maxWorkers; i++) {
            this.addNewWorker();
        }
    }

    private addNewWorker() {
        const worker = new Worker(this.workerScript);
        worker.on('message', (result) => {
            this.activeWorkers.delete(worker);
            this.processQueue();
        });
        worker.on('error', (error) => {
            console.error('Worker error:', error);
            this.activeWorkers.delete(worker);
            this.processQueue();
        });
        this.workers.push(worker);
    }

    private processQueue() {
        if (this.queue.length > 0 && this.activeWorkers.size < this.maxWorkers) {
            const task = this.queue.shift();
            if (task) {
                this.runTask(task);
            }
        }
    }

    private async runTask(task: (worker: Worker) => Promise<any>) {
        const availableWorker = this.workers.find(worker => !this.activeWorkers.has(worker));
        if (availableWorker) {
            this.activeWorkers.add(availableWorker);
            try {
                const result = await task(availableWorker);
                return result;
            } finally {
                this.activeWorkers.delete(availableWorker);
            }
        }
        throw new Error('No available workers');
    }

    close() {
        for (const worker of this.workers) {
            worker.terminate();
        }
    }

    run(task: (worker: Worker) => Promise<any>): Promise<any> {
        return new Promise((resolve, reject) => {
            const taskWrapper = async (worker: Worker) => {
                try {
                    const result = await task(worker);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };

            if (this.queue.length < this.maxQueueSize) {
                this.queue.push(taskWrapper);
                this.processQueue();
            } else {
                reject(new Error('Server is busy. Please try again later.'));
            }
        });
    }

    getQueueLength(): number {
        return this.queue.length;
    }

    getActiveWorkers(): number {
        return this.activeWorkers.size;
    }
}

export default WorkerPool;



// export default WorkerPool;






