import { Queue } from "bullmq"
import WorkerManager from "./workers";
import { CommunicationServiceLayer } from "../communicationService";


export const addJobToQueue = async (queueName: string, jobName: string, data: Record<string, string>) => {
    const myQueue = new Queue(queueName);
    const job = await myQueue.add(jobName, data)
    console.log(`Job ${job.id} has been added to the queue`);
}

export const pushQueue = new Queue("singlePushQueue")
export const batchPushQueue = new Queue("batchPushQueue")
export const emailQueue = new Queue("singleEmailQueu")
export const batchEmailQueue = new Queue("batchEmailQueue")
export const smsQueue = new Queue("smsQueue")




new WorkerManager(pushQueue).startWorker(10, 3, CommunicationServiceLayer.sendPushNotificationToDevice)

new WorkerManager(batchPushQueue).startWorker(10, 1, CommunicationServiceLayer.sendPushNotificationToDevices)


new WorkerManager(batchEmailQueue).startWorker(10, 3, CommunicationServiceLayer.sendBatchEmails)

new WorkerManager(emailQueue).startWorker(10, 3, CommunicationServiceLayer.sendSingleEmail)

new WorkerManager(smsQueue).startWorker(8, 3, CommunicationServiceLayer.sendSMS)

new WorkerManager(batchEmailQueue).startWorker(10, 2, CommunicationServiceLayer.sendBatchEmails)




