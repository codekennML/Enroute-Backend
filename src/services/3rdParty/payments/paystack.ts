import { PAYSTACK_SECRET } from './../../../config/constants/payments';
import paystack from "paystack"

const paystackLib = paystack(PAYSTACK_SECRET)

class PaystackPayments {

    private paystack: typeof paystackLib;

    constructor(service: typeof paystackLib) {
        this.paystack = service;
    }

    async verifyTransactionById(transactionId: string) {
        const data = await this.paystack.transaction.verify(transactionId);

        return data;
    }
}

const PaystackPay = new PaystackPayments(paystackLib);

export default PaystackPay
