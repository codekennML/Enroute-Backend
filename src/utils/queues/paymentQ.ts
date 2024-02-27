import JobQueue, { QueueRequest } from ".";
// import { Prettify } from '../../../types/types';
import { PaymentServiceLayer } from "../../services/paymentService";

type PaymentData = {
  user: string;
  amount: number;
  reference: string;
  recipient: string;
};

class PaymentQueue extends JobQueue<PaymentData> {
  constructor() {
    super("PaymentQueue", 1); // Specific queue with a concurrency of 2
  }

  protected async processJob(job: QueueRequest<PaymentData>) {
    const transferQueue = await PaymentServiceLayer.intiateBulkTransfer(
      job.data
    );

    return transferQueue;
  }
}

// Example usage
export const paymentQueue = new PaymentQueue();
