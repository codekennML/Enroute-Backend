import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { 
    emailQueue, 
    pushQueue, 
    batchEmailQueue,
    batchPushQueue,
    smsQueue 

} from "./queue"

export const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queueviewer/ui');

createBullBoard({
    queues: [
        new BullMQAdapter(emailQueue),
        new BullMQAdapter(batchEmailQueue),
        new BullMQAdapter(pushQueue),
        new BullMQAdapter(batchPushQueue),
        new BullMQAdapter(smsQueue)
    ],
    serverAdapter,
});

