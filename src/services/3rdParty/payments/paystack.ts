

import { PAYSTACK_SECRET } from './../../../config/constants/payments';
import axios, { AxiosInstance } from "axios"
import { QueueLogger, webhooksLogger } from '../../../middlewares/logging/logger';
import { Paystack } from '../../../../types/types';


class PaystackPayments {


    private secretKey: string
    private client: AxiosInstance


    constructor(secretKey: string) {
        this.secretKey = secretKey,
            this.client = axios.create({
                baseURL: "api.paystack.co",
                headers: {
                    Authorization: this.secretKey,
                    "Content-Type": "application/json",
                }
            })
    }

    async initializePayment(data: { amount: number, email: string, reference: string, metadata?: Record<string, string | number | boolean | object>, callbackUrl?: string }) {

        const initUrl = "/transaction/intialize"

        const response = await this.client.post<Paystack.Initialize>(initUrl, {
            email: data.email,
            amount: data.amount,
            reference: data.reference,

            ...(data?.metadata && { metadata: data.metadata }),
            ...(data?.callbackUrl && { callbackUrl: data.callbackUrl })
        })

        return response


    }

    async verifyTransactionByReference(settlementId: string) {
        const data = await this.client.get<Paystack.VerifyResponse>(`/transaction/verify/:${settlementId}`)

        return data;
    }


    async chargeAuthorization(data: { authorizationCode: string, email: string, amount: number, settlementId: string, currency: string }) {


        try {

            const result = await this.client.post<Paystack.VerifyResponse>("/transaction/charge_authorization", {
                amount: data.amount,
                authorization_code: data.authorizationCode,
                email: data.email,
                reference: data.settlementId,
                currency: data.currency,
                queue: true
            })

            if (!result.status) {
                QueueLogger.error(`Billing Queue Error : Payment charge error -  settlement - ${data.settlementId} - message - Invalid Paystack key `)

                throw new Error(`Billing Queue Error  - Invalid Paystack key - settlement - ${data.settlementId}`)
            }

            return { success: true }

        } catch (e: unknown) {

            const error = e as Error & { status?: number }

            if (error && error?.status && error.status === 408) {
                //Timeout error 

                //Verify that this wasnt successful, then throw an error 

                const result = await this.verifyTransactionByReference(data.settlementId)

                const { status } = result.data.data

                if (status === "success") return { success: true }

                //This will send a webhook to our systems already

                QueueLogger.error(`Billing Queue Error : Payment charge error -  settlement - ${data.settlementId} - message - ${error?.message}`)

                throw new Error(`Billing Queue Error : Payment charge error -  settlement - ${data.settlementId} - message - ${error?.message}`) //If this is false, we just need to run a cron that cleans up created payments that were not processed,      

            }

        }



    }

    async refundPayment(transactionId: string) {

        try {

            const response = await this.client.post<{ status: boolean, message: string, data: unknown }>("/refund", {
                transaction: transactionId
            })

            if (response?.status !== 200) {
                //Log the error {} 
                throw new Error(`Refund failed with error - ${response?.data?.message} for settlement -  ${transactionId} `)

            }
        } catch (e) {
            webhooksLogger.error(`Paystack refund error - ${(e as Error)?.message}`)

        }

        return

    }
}

const PaystackPay = new PaystackPayments(PAYSTACK_SECRET);

export default PaystackPay
