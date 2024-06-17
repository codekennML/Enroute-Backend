
import QueueManager from "./manager";
import { CommunicationServiceLayer } from "../communicationService";
import { EmailData, PushData} from "../../../types/types";
import { SENDCHAMPWHATSAPPDATA, SENDCHAMPSMSDATA } from "../sendchamp";


// export const addJobToQueue = async (queueName: string, jobName: string, data: Record<string, string>) => {
//     const myQueue = new Queue(queueName);
//     const job = await myQueue.add(jobName, data)
//     console.log(`Job ${job.id} has been added to the queue`);
// }

const pushQueueManager  = new QueueManager<PushData>("singlePushQueue")
const batchPushQueueManager = new QueueManager<PushData>("batchPushQueue")
const singleEmailQueueManager = new QueueManager<EmailData>("singleEmailQueue")
const smsQueueManager = new QueueManager<SENDCHAMPSMSDATA | SENDCHAMPWHATSAPPDATA>("smsQueue")


export const pushQueue =  pushQueueManager.getQueue()
export const batchPushQueue = batchPushQueueManager.getQueue()
export const emailQueue = singleEmailQueueManager.getQueue()

export const smsQueue = smsQueueManager.getQueue()




pushQueueManager.startWorkers(10, 3, CommunicationServiceLayer.sendPushNotificationToDevice)

batchPushQueueManager.startWorkers(10, 1, CommunicationServiceLayer.sendPushNotificationToDevices)


singleEmailQueueManager.startWorkers(10, 3, CommunicationServiceLayer.sendSingleEmail)

smsQueueManager.startWorkers(15, 3, CommunicationServiceLayer.sendOTPMobile)






