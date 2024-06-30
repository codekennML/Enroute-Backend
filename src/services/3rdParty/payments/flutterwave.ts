

import { FLUTTERWAVE_SECRET_KEY } from './../../../config/constants/payments';
import axios, { AxiosInstance } from "axios"
import { QueueLogger,webhooksLogger } from '../../../middlewares/logging/logger';
import { Flutterwave } from '../../../../types/types';


class FlutterwavePayments {
     
     
 private secretKey : string 
 private client : AxiosInstance
  

    constructor(secretKey : string ) {
        this.secretKey = secretKey,
        this.client =  axios.create({
            baseURL: "https://api.flutterwave.com/v3/",
            headers: {
                Authorization : this.secretKey,
                "Content-Type": "application/json",
            }
        })
    }

    // async initializePayment(data: {amount: number, email: string, reference: string, metadata?: Record<string, string | number | boolean | object>, callbackUrl?: string }){

    //     const initUrl  =  "/transaction/intialize"

    //     const response  =  await this.client.post<Paystack.Initialize>(initUrl, {
    //       email : data.email, 
    //       amount: data.amount,
    //       reference : data.reference, 
       
    //       ...(data?.metadata && { metadata : data.metadata}),
    //       ...(data?.callbackUrl && { callbackUrl  : data.callbackUrl})
    //     })

    // return response

    
    // }

    async verifyTransactionByReference(settlementId: string) {

        const data = await this.client.get<Flutterwave.Verification>(`/transactions/verify_by_reference?tx_ref=${settlementId}`)
  
        return data;
    }


    async chargeAuthorization(data : { authorizationCode : string, email : string , amount : number, settlementId : string, currency : string }){ 


      try{
           
         const result = await this.client.post<Flutterwave.Verification>("/tokenizedCharges",{
              token : data.amount, 
              authorization_code : data.authorizationCode, 
              email : data.email,
              tx_ref : data.settlementId,
             currency: data.currency,
          })

          if (!result.status || result.status == 400 ) {
              QueueLogger.error(`Billing Queue Error : Payment charge error -  settlement - ${data.settlementId} - status : ${result.status}`)

             throw new Error(`Billing Queue Error : Payment charge error -  settlement - ${data.settlementId} - status : ${result.status}`) } 

          return { success : true}

      } catch (e : unknown ) {

        const error =  e as Error & {status? : number}

         if(error && error?.status && error.status === 408){
         //Timeout error 

         //Verify that this wasnt successful, then throw an error 

         const result =  await this.verifyTransactionByReference(data.settlementId) 

        const{ status } = result.data.data

         if(status === "successful") return { success :     true }

         //This will send a webhook to our systems already
         
            QueueLogger.error(`Billing Queue Error : Payment charge error -  settlement - ${data.settlementId} - message - ${error?.message }`)
             
            throw new Error(`Billing Queue Error : Payment charge error -  settlement - ${data.settlementId} - message - ${error?.message }`) //If this is false, we just need to run a cron that cleans up created payments that were not processed,      

      }

    }
 

    }


    async refundPayment(transactionId : string) {

try{
      const url  =  `/transactions/${transactionId}/refund`

    const response  =  await this.client.post<Flutterwave.RefundInitiatedResponse>(url, {
        transaction : transactionId
    }) 

    if(response?.status !== 200){
        //Log the error {} 
        throw new Error(`Refund failed with error - ${response?.data?.message} for settlement with transactionId -  ${transactionId} `)
   
    }  
}catch (e){
     webhooksLogger.error(`Flutterwave refund error - ${(e as Error)?.message}`)      
}

        return 

    }
}

const FlutterwavePay = new FlutterwavePayments(FLUTTERWAVE_SECRET_KEY);

export default FlutterwavePay
