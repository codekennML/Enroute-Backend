
import QueueManager from "./manager";
import { CommunicationServiceLayer } from "../communicationService";
import { EmailData, PushData} from "../../../types/types";
import { Settlement } from "../../controllers/settlementsController";
import { SMSDATA, WhatsAppDATA } from "../3rdParty/termii";




const pushQueueManager = new QueueManager<PushData>("singlePushQueue", CommunicationServiceLayer.sendPushNotificationToDevice)


const batchPushQueueManager = new QueueManager<PushData>("batchPushQueue", CommunicationServiceLayer.sendPushNotificationToDevices)
const singleEmailQueueManager = new QueueManager<EmailData>("singleEmailQueue", CommunicationServiceLayer.sendSingleEmail )

const smsQueueManager = new QueueManager<SMSDATA | WhatsAppDATA >("smsQueue", CommunicationServiceLayer.sendOTPMobile)

const billingQueueManager =  new QueueManager<string>("billingQueue", Settlement.handleQueueSettlements)


export const pushQueue =  pushQueueManager.getQueue()
export const batchPushQueue = batchPushQueueManager.getQueue()
export const emailQueue = singleEmailQueueManager.getQueue()

export const smsQueue = smsQueueManager.getQueue()
export const billingQueue = billingQueueManager.getQueue()



pushQueueManager.startWorkers(10, 3)

batchPushQueueManager.startWorkers(5, 2)

singleEmailQueueManager.startWorkers(10, 3)

smsQueueManager.startWorkers(10, 3)

billingQueueManager.startWorkers(10, 3)






