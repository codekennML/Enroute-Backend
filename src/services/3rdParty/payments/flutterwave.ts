import { Flutterwave } from "../../../../types/types";
const FLWAVE = require("flutterwave-node-v3");
const flw = new FLWAVE(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

class FlutterwavePayments {
  private flw: typeof FLWAVE;

  constructor(service: typeof FLWAVE) {
    this.flw = service;
  }

  async verifyTransactionById(transactionId: string) {
    const data: Flutterwave.Verification = await this.flw.Transaction.verify({
      id: transactionId,
    });

    return data;
  }
}

const FlutterwavePay = new FlutterwavePayments(flw);

export default FlutterwavePay;
