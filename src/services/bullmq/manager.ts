import { Worker, Queue, Job } from "bullmq";
import { QueueLogger } from "../../middlewares/logging/logger";
import  {RedisOptions } from "ioredis"
import  redisClient, { redisOptions}  from "../redis";


const WorkersMap = new Map<string, Worker[]>()

export class QueueManager<T> {
    // private workers: Worker[] = [];
    private queue: Queue<T>;
    private connection: RedisOptions
    private processor : (data : T) => void | Promise<void>

    constructor(queueName: string, processor: (data : T) => void | Promise<void> ) {
        if (!queueName) {
            throw new Error('QueueName is required');
        }
        this.connection =   redisOptions
        // this.connection =  redisClient

        this.queue = new Queue(queueName, {connection : this.connection}) 
        this.processor = processor
       
    }
    
    getQueue() { 
        return this.queue
    }

    async startWorkers(concurrency: number, count: number) {
        for (let i = 0; i < count; i++) {
            const worker = new Worker<T>(
                this.queue.name,
                async (job: Job<T>) => {

                 
                    try {

                        if (!job ) throw new Error("No job data found for processing");

                      
                            await this.processor(job.data)
                       
                    } catch (e: unknown) {
                        QueueLogger.error(`Queue error: Queue name - ${this.queue.name}, error - ${(e as Error).message}`);
                    }
                },
                { concurrency, connection: this.connection }
            );
   
          
            const workers = WorkersMap.get(this.queue.name) ?? []
            workers.push(worker)
            WorkersMap.set(this.queue.name, workers)


            // this.workers.push(worker);

            worker.on("completed", (job) => {
                console.log(`Job ${job.id} has been completed`);
            });

            worker.on("failed", (job, err) => {
                console.error(`Job ${job?.id} has failed: ${err.message}`);
            });

            console.log(`Worker ${i + 1} for ${this.queue.name} started`);
        }
    }

    async stopAllWorkers(queueName : string) {
        const workers  = WorkersMap.get(queueName) ?? []

        const result : { message : string, error : boolean } = { message : "No worker to stop for this queueu=", error : false}
        
        if(workers?.length ==0 ) return result

        try { 

            for (const worker of workers) {
                await worker.close();
            }

            WorkersMap.delete(queueName)
    
            QueueLogger.info(`All  ${WorkersMap.get(this.queue.name)?.length} workers for ${this.queue.name} have been stopped successfully`)

            result.message = `All workers for ${this.queue.name} have been stopped`
    

        } catch(error : unknown) {
            QueueLogger.error(`Error stopping  all ${WorkersMap.get(this.queue.name)?.length} workers for ${this.queue.name} `)
        
            result.message =  `An error occurred -  ${(error as Error).message}`
            result.error = true
        }

        return result
    }

    async scaleUpWorkers(count : number, concurrency : number ){

        const result: { message: string, error: boolean } = { message: "", error: false }

        try{

           await this.startWorkers(concurrency, count)
   
           result.message =  `${count} more ${count > 1 ? "workers" : "worker"} with  a concurrency of ${concurrency} has been added to ${this.queue.name}`
           
          } catch (error : unknown){ 

            QueueLogger.error(`Error adding ${count > 1 ? "workers" : "worker"}  for ${this.queue.name} `)

            result.message = `An error occurred -  ${(error as Error).message}`
            result.error = true


          }

          return result
    }

    async scaleDownWorkers(count : number ){  

        const workers =  WorkersMap.get(this.queue.name) 

        const result: { message: string, error: boolean } = {
            message: "No workers available to stop for this queue", error: false }


        if(!workers ||workers?.length === 0 ) return result

        try{ 

            const index : number[] = []

            for(let i = 0 ; i < count + 1; i++){ 
               workers[i].close()
               index.push(i)
            } 

         const remainingWorkers =   workers.filter((_,  index : number) => !workers[index] )

            WorkersMap.set(this.queue.name, remainingWorkers)
            
            result.message = `${count}  ${count > 1 ? "workers have" : "worker has"}   been removed from ${this.queue.name}`
        }
catch(error : unknown) { 
            QueueLogger.error(`Error adding ${count > 1 ? "workers" : "worker"}  for ${this.queue.name} `)

            result.message = `An error occurred -  ${(error as Error).message}`
            result.error = true

}

return result

    }
    






}

export default QueueManager;
