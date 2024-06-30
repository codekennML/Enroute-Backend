import { UserServiceLayer } from './../services/userService';
import { Flutterwave, MatchQuery, Paystack, SortQuery } from "./../../types/types.d";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { ISettlements } from "../model/interfaces";
import SettlementService, {
  SettlementServiceLayer,
} from "../services/settlementService";
import AppResponse from "../utils/helpers/AppResponse";
import { Request, Response } from "express";
import { FLW_SECRET_HASH, PAYSTACK_SECRET } from "../config/constants/payments";
import { QueueLogger, webhooksLogger } from "../middlewares/logging/logger";

import { retryTransaction } from "../utils/helpers/retryTransaction";
import { ClientSession, Types } from "mongoose";
import AppError from "../middlewares/errors/BaseError";
import { sortRequest } from "../utils/helpers/sortQuery";
import User from "../model/user";
import { RideServiceLayer } from "../services/rideService";
import { Ride } from "../model/rides";
import { logEvents } from "../middlewares/errors/logger";
import { emailQueue, pushQueue } from "../services/bullmq/queue";
import {  COMPANY_SLUG } from "../config/constants/base";
import { CommissionDebitFailedMail } from "../views/mails/commissionFailedDebit";
import { CommissionDebitSuccesssMail } from "../views/mails/commissionSuccessDebit";
import { CountryServiceLayer } from '../services/countryService';
import { ROLES } from '../config/enums'
import FlutterwavePay from '../services/3rdParty/payments/flutterwave';


type SearchKeys = Partial<{ [K in keyof ISettlements]: ISettlements[K] }> & {
  maxAmount?: number;
  minAmount?: number;
  sort?: string;
  cursor?: string;
};

class SettlementController {
  private settlement: SettlementService;

  constructor(service: SettlementService) {
    this.settlement = service;
  }

  async initializeSettlementPayments(req: Request, res: Response) {

    const data: Omit<ISettlements, "status" | "processed"  | "workerCreated" | "refunded" > & Partial<Pick<ISettlements, "workerCreated">>  = req.body;

    // const { amount, processor, driverId, rides } = data;

    const newSettlements = await this._initializeSettlements(
      data
    );

    
    //Call the api here for the authorization url

    const driverId = newSettlements[0].driverId
   
    const response  =  { 
      email : `${driverId}@${COMPANY_SLUG}`, 
      reference : newSettlements[0]._id,
      amount : newSettlements[0].amount
    }


    return AppResponse(req, res, StatusCodes.CREATED, {
      message: "Settlement created successfully",
      data: response
    })
  }

  // async initializeFailedPayments(req : RE)

  async _initializeSettlements(
    info: (Omit<ISettlements, "status" | "processed"  | "workerCreated" | "refunded"> & { workerCreated? : boolean }), session? : ClientSession
  ) {



    const settlementsToCreate = {
      ...info, 
      status: "created" as const ,
      processed: false,
      workerCreated: info?.workerCreated ?? false,
     refunded: false
    }

    const newSettlements = await this.settlement.createSettlements(settlementsToCreate, session  );

    return newSettlements;

  }

 //worker
  async handleQueueSettlements(driverId : string){ 

    const settleBillSession = async (args : { driverId : string}, session : ClientSession) => {

    const result =  await session.withTransaction(async() =>{
   //Get the user payment Method
    const user  =  await UserServiceLayer.getUserById(args.driverId, "paymentMethod.authorization email googleEmail deviceToken country") 

    
    if(!user || !user.paymentMethod){ QueueLogger.error(`Billing Queue Error : User retrieval Failed -  ${args.driverId}`) 
      throw new Error(`Billing Error : User retrieval Failed`)
  }

  const userCountryData =  await CountryServiceLayer.getCountries({
    query : { name : user.country},
    select : "currency paymentProcessorbillingExtraAmount paymentProcessorbillingPercentage "
  })
  if(!userCountryData ||  userCountryData.length === 0  ){ QueueLogger.error(`Billing Queue Error : User country and currency data retrieval Failed -  ${args.driverId}`) 
    throw new Error(`Billing Error : User country and currency data retrieval Failed`)
}

  const userSettlementInfo = await RideServiceLayer.aggregateRides({ 
    pipeline : [
      {$match : {driverId : args.driverId }},
      { $facet : { 

        amount: [{ $group: { _id: null, amount: { $sum: "$totalCommission" } } }], 

        rideIds : [ {
          $group : { _id : null,  rides : {$push : "$_id"}}
          
        }]
      
      }},
      {$project : {
            amountToSettle : {$arrayElemAt : ["$amount.amount" , 0 ] },
            rides: { $arrayElemAt: ["$rideIds.rides", 0] }
           }}
    ]
  }) 

  if(!userSettlementInfo) {
    QueueLogger.error(`Billing Queue Error :Rides settlement retrieval failed -  ${args.driverId}`)
    throw new Error(`Billing Queue Error : Rides settlement retrieval failed - ${args.driverId} `)
  } 
  
  //Create the settlementData that will handle this payment 
    const createdSettlement = await this._initializeSettlements({
      amount : userSettlementInfo[0].amountToSettle,
      processor : "flutterwave",
      currency : userCountryData[0].currency,
      driverId : new Types.ObjectId(args.driverId),
      rides : userSettlementInfo[0].rides,
      isPaymentInit: false, 
     ...((user?.email || user?.googleEmail) && { driverEmail : user?.email ?? user.googleEmail} ), 

       ...(user?.deviceToken  && { driverPushId: user.deviceToken}),
       workerCreated : true,
       type : "commission"
    }, session)
  //We are passing the charge here to the user
      const userBill = userSettlementInfo[0].amountToSettle
  
    //Push the payment api to bill the authorization
    await FlutterwavePay.chargeAuthorization({
      authorizationCode : user.paymentMethod?.authorization.authorization_code , 
      email : `${args.driverId}@${COMPANY_SLUG}`, 
      settlementId : createdSettlement[0]._id.toString(), 
      amount : userBill,
      currency : userCountryData[0].currency

    })
  
    return { success : true}

  })

  return result

     }  

    await retryTransaction(settleBillSession, 2,  {driverId})

  }
//worker
  async processSubscriptionQueue(driverId : string ){ 

   
    const user =  await UserServiceLayer.getUserById(driverId, "deviceToken googleEmail email country paymentMethod _id")

    if (!user || !user.paymentMethod) throw new Error(`Subscription Error : Error retrieving user data for user with id - ${driverId} `)

      const userCountryData =  await CountryServiceLayer.getCountries({
        query : { name : user.country},
        select : "currency paymentProcessorbillingExtraAmount paymentProcessorbillingPercentage monthlySubscription"
      })
      if(!userCountryData ||  userCountryData.length === 0  ){ QueueLogger.error(`Subscription Queue Error : User country and currency data retrieval Failed - driver- ${driverId}`) 
        throw new Error(`Subscription Queue Error : User country and currency data retrieval Failed`)
    }

    //Create the settlementData that will handle this payment 
    const createdSettlement = await this._initializeSettlements({
      amount: userCountryData[0].monthlySubscription,
      processor: "flutterwave",
      driverId: new Types.ObjectId(driverId),
      ...((user?.email || user?.googleEmail) && { driverEmail: user?.email ?? user.googleEmail }),

      ...(user?.deviceToken && { driverPushId: user.deviceToken }),
      currency : userCountryData[0].currency,
      workerCreated: true,
      type: "subscription",
      isPaymentInit : false
    })

    if (!createdSettlement) throw new Error(`Subscription Error : Error creating settlement data for user with id - ${driverId} `)

      const userBill =  userCountryData[0].monthlySubscription
  
    //Push the payment api to bill the authorization
    await FlutterwavePay.chargeAuthorization({
      authorizationCode: user.paymentMethod.authorization.authorization_code,
      email: `${driverId}@${COMPANY_SLUG}`,
      settlementId: createdSettlement[0]._id.toString(),
      amount: userBill,
      currency : userCountryData[0].currency
    })

    return { success: true }

  }

  async settlementsWebhookHandler(req: Request, res: Response) {
     // If you specified a secret hash, check for the signature
     const secretHash = FLW_SECRET_HASH;
     const signature = req.headers["verif-hash"];

     if (!signature || (signature !== secretHash)) {
      throw new AppError(
        getReasonPhrase(StatusCodes.UNAUTHORIZED),
        StatusCodes.UNAUTHORIZED)
     }

     const payload = req.body;

     // It's a good idea to log all received events.
     webhooksLogger.info(payload);
     
     const tx_ref  = payload?.data?.tx_ref 

     if(!tx_ref) throw new AppError( getReasonPhrase(StatusCodes.NOT_FOUND),
     StatusCodes.NOT_FOUND)

    const { data  } = await FlutterwavePay.verifyTransactionByReference(tx_ref)
  
    const { status } =  data

    const isProcessed = await this.settlement.getSettlementsById(
    tx_ref,
      "processed amount isPaymentInit _id"
    );

    if (!isProcessed) return AppResponse(req, res, StatusCodes.NOT_FOUND, { message : "payment not found"})

    if (isProcessed.processed) return AppResponse(req, res, StatusCodes.OK, {message : "Webhook already processed"})

      if(!data) throw new AppError(getReasonPhrase(StatusCodes.NOT_FOUND),
      StatusCodes.NOT_FOUND)

    if (status === "successful" && payload?.event ===  "charge.completed")
      await retryTransaction(this.#handleFailedSettlementWebhooks, 1, data);

    if (
       status === "failed" && payload?.event ===  "charge.completed"
    ) 

      await retryTransaction(
        this.#handleSuccessfulSettlementWebhooks,
        1,
        result
      );

      if(isProcessed.isPaymentInit){
        //Refund  the driver if this was a card initialization
        await FlutterwavePay.refundPayment(isProcessed._id.toString())
      }

      if (
        status === "success" && payload?.event ===  "refund.processed"
     )  
 
       await retryTransaction(
         this._handleRefundPayment()
         1,
         result
       );

   

  return AppResponse(req, res, StatusCodes.OK, { message : "Webhook processed successfully"})
  }

  async #handleSuccessfulSettlementWebhooks(
    args: Flutterwave.Verification,
    session: ClientSession
  ) {
    const result = await session.withTransaction(async () => {
      //Update the settlement to successful

      const settlement = await this.settlement.updateSettlements({
        docToUpdate: { _id: args.data.reference },
        updateData: {
          $set : {
            processed: true,
            status: "success",
            data : {...args}
          }
        },
        options: { new: true, select: "rides _id driverId isPaymentInit driverEmail driverPushId amount settlements", session },
      });

      if (!settlement)
        throw new AppError(
          getReasonPhrase(StatusCodes.NOT_FOUND),
          StatusCodes.NOT_FOUND
        );

       if(settlement?.rides)
  {
      const updatedSettledRides = await RideServiceLayer.updateManyRides({
        //@ts-expect-error ts not reading type correctly
        filter: { _id: { $in: settlement.rides } },
        updateData: {
          $set: {
            settlementId: settlement._id,
            commissionPaid: true,
          }
        },
        options: { session, new: true, select: "isPaymnentInit" }
      }
      );

      if (!updatedSettledRides)
        throw new AppError(
          getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
          StatusCodes.INTERNAL_SERVER_ERROR
        );

       }
       
      const shouldUpdatePaymentMethod = settlement?.isPaymentInit || (settlement.settlements && settlement.settlements?.length > 0)

      const userId = settlement?.driverId

      if (shouldUpdatePaymentMethod) {
        await UserServiceLayer.updateUser({
          docToUpdate: {
            _id: new Types.ObjectId(userId)
          },
          updateData: {
            $set: {
              paymentMethod: {
                authorization: args.data.authorization,
                customer: args.data.customer,
                isValid: true,
                defaults :[]
              }
            }
          },
          options: { session }
        })
      }


      return settlement
    });

    const mail = CommissionDebitSuccesssMail(result.amount)

    if(result?.driverEmail){

      emailQueue.add(`settlement_success_user_${result.driverId}_id${args.data.reference}`, {
        to: result.driverEmail,
        from :`info@${COMPANY_SLUG}`,
        template: mail,
        subject: `Commission Charge Success  - ${new Date()} `,
        reply_to: `noreply@${COMPANY_SLUG}`
      }, { priority : 1 })
    } else { 
      pushQueue.add(`settlement_success_user_${ result.driverId }_id${ args.data.reference }`, {
        deviceTokens : result.driverPushId!, 
        message : {
          body : `A commission charge of ${result.amount} has been charged from your account.`,
          title : "Commission Charge ", 
          screen : "transactions", 
          id : result._id.toString()
        }
      
      }, { priority : 1})
    }


    return result._id
  }

  async #handleFailedSettlementWebhooks(
    args: Flutterwave.Verification,
    session: ClientSession
  ) {
    const result = await session.withTransaction(async () => {
      
      //set the status to failed , until the user adds a new payment method. once a new calc is added, then charge immediately after checking ig there is a failed settlement to be made 

      const settlementInfo =
        await this.settlement.getSettlementsById(args.data.reference, " driverId")

      if (!settlementInfo || !settlementInfo) {

        logEvents(`Error retrieving settlement ${args.data.reference} for status update to failed`, "errLog.log")
        throw new AppError(getReasonPhrase(StatusCodes.NOT_FOUND), StatusCodes.NOT_FOUND)
      }


       const settlementData = await this.settlement.updateSettlements({
          docToUpdate: { _id: args.data.reference },
          updateData: {
            $set : {
              status : "failed",
              data : args

            }
          },
          options: { new: true, select: "_id driverId amount type", session },
        });

      if (!settlementData || !settlementData?.amount)
        throw new AppError(getReasonPhrase(StatusCodes.NOT_FOUND), StatusCodes.NOT_FOUND)


     const userData  =  await UserServiceLayer.updateUser({
        docToUpdate: { _id: settlementInfo.driverId },
        updateData: {
          $set :  {
            "paymentMethod.isValid": false, 
          }, 
          $push : {
           defaults : settlementData._id
          }

        },
        options: { session, select : "email googleEmail deviceToken" }
      })
    
    if (!userData || !userData?.deviceToken)
      throw new AppError(getReasonPhrase(StatusCodes.NOT_FOUND), StatusCodes.NOT_FOUND)


     if(userData?.email || userData?.googleEmail) {

       const mail = CommissionDebitFailedMail(settlementData.amount)
  
       emailQueue.add(`settlement_failed_user_${settlementData.driverId}_id${args.data.reference}`, {
         to: userData?.email ? userData.email! : userData.googleEmail! ,
         from : `info@${COMPANY_SLUG}`,
         template: mail,
         subject: "Commission Charge Failed ",
         reply_to: `noreply@${COMPANY_SLUG}`
       })
     } 
     else {

       pushQueue.add(`settlement_failed_user_${settlementData.driverId}_id${args.data.reference}`, {
         deviceTokens : userData.deviceToken,
         message : { 
           body: `We were unable to charge a commission amount  ${settlementData.amount} to your payment method on record. Kindly  update your payment method to ride effortlessly.`,
           title: "Commission Charge Error ",
           screen: "transactions",
           id: settlementData._id.toString()
         },
        
       })
     } 

      return settlementData._id;

      })
      
      
    return result;
  }

   _handleRefundPayment = async(settlementId : string ) => {

   const refundedSettlement  =  await this.settlement.updateSettlements({
      docToUpdate : {_id : new Types.ObjectId(settlementId)}, 
      updateData : { 
        $set :{ refunded : true }
      },
      options : { new : true, select : "_id"}
   }) 

   if(!refundedSettlement) throw new AppError(getReasonPhrase(StatusCodes.NOT_FOUND), StatusCodes.NOT_FOUND)

  return 
  }
//Cron job
  async cleanCreatedWorkerSettlements(){
    //Here we are going to clean settlements that were created by the billing queue workers but the payment api did not respond, usually this would happen if the call to  the api failed but the worker already created the settlement, this is a cron job and should run atleast four hours after the billing queue has been processed - Billing Queue - 12:30AM daily - clean Cron -  4:20AM

    const deletedSettlements = 
      await this.settlement.deleteSettlements({ 
        filter :{ 
        status: { $eq: "created" }, 
        workerCreated: true 
        }
      })
    
      return deletedSettlements
  

    }

  
  async getSettlementsAdmin(req: Request, res: Response) {
    const data: Omit<SearchKeys, "status">  & { status? : string[]} = req.params;

    const response = await this.#getSettlements(data);

    return AppResponse(
      req,
      res,
      response?.hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
      {
        message: response?.hasData
          ? `Settlements  retrieved succesfully`
          : `No settlements were found for this request `,
        data: response.result,
      }
    );
  }

  async getSettlementsForDriver(req: Request, res: Response) {
    //@ts-expect-error ts not inferring the query properly
    const data : { driverId: string; cursor?: string } = req.query

    const { cursor, driverId } = data;

    const response = await this.#getSettlements({
      driverId: new Types.ObjectId(driverId),
      status : ["success", "failed"],
      cursor,
    });

    return AppResponse(
      req,
      res,
      response?.hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
      {
        message: response?.hasData
          ? `Settlements  retrieved succesfully`
          : `No settlements were found for this request `,
        data: response.result,
      }
    );
  }

  async #getSettlements(data: Omit<SearchKeys, "status"> & { status?: string[] }) {
    const {
      status,
      processor,
      processed,
      driverId,
      maxAmount,
      minAmount,
      cursor,
      sort,

    } = data;


    const matchQuery: MatchQuery = {};

    if (data?.driverId) {
      matchQuery.driverId = { $eq: driverId };
    }
    if (data?.status) {
      matchQuery.status = { $eq: status };
    }
  
    if (data?.processed) {
      matchQuery.processed = { $eq: processed };
    }
    if (data?.minAmount) {
      matchQuery.amount = { $gte: minAmount };
    }
    if (data?.maxAmount) {
      matchQuery.amount = { $lte: maxAmount };
    }
    if(data?.status){ 
      matchQuery.status = { $in : data.status}
    }

    if (data?.processor) {
      matchQuery.processor = { $eq: processor };
    }

    if (data?.country) {
      matchQuery.country = { $eq: data?.country };
    }

    if (data?.state) {
      matchQuery.state = { $eq: data?.state };
    }

    if (data?.town) {
      matchQuery.town = { $eq: data?.town };
    }

    const sortQuery: SortQuery = sortRequest(sort);

    if (data?.cursor) {
      const orderValue = Object.values(sortQuery)[0] as unknown as number;

      const order = orderValue === 1 ? { $gt: cursor } : { $lt: cursor };

      matchQuery._id = order;
    }

    const query = {
      query: matchQuery,
      aggregatePipeline: [sortQuery, { $limit: 101 }],
      pagination: { pageSize: 100 },
    };

    const result = await this.settlement.findSettlements(query);

    const hasData = result?.data?.length > 0;

    return {
      hasData,
      result,
    };
  }

  async getSingleSettlement(req: Request, res: Response) {
    const { id } = req.params;

    const settlement = await this.settlement.returnPopulatedSettlement({
      query: { _id: {$eq : new Types.ObjectId(id)}},
      populatedQuery: [
        {
          path: "rides",
          select: "fare riderId driverId ",
          model: Ride
        },
        {
          path: "rides.riderId",
          select: "firstname lastname avatar",
          model: User,
        },
        {
          path: "rides.driverId",
          select: "firstname lastname avatar",
          model: User,
        },
      ],
    });

    const hasData = settlement.length === 0;

  if(settlement.length > 0 && settlement[0].driverId !== req.user && req.role in [ROLES.DRIVER, ROLES.RIDER]) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)

    return AppResponse(
      req,
      res,
      hasData ? StatusCodes.NOT_FOUND :  StatusCodes.OK,
      {
        message: !hasData
          ? "Settlement retrived successfully"
          : "No settlements were found for this request",
        data: settlement[0],
      }
    );
  }
  async updateSettlement(req: Request, res: Response) {
    const { status, settlementId } = req.body;

    const updatedSettlement = await this.settlement.updateSettlements({
      docToUpdate: { _id: settlementId },
      updateData: {
        $set: {
          status: { $eq: status },
        },
      },
      options: { new: false },
    });

    if (updatedSettlement)
      throw new AppError(
        getReasonPhrase(StatusCodes.NOT_FOUND),
        StatusCodes.NOT_FOUND
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Settlement updated successfully",
      data: { settlementId: settlementId },
    });
  }

  async deleteSettlements(req: Request, res: Response) {
    const settlementIds: string[] = req.body;

    if (settlementIds.length === 0)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const deletedSettlements = await this.settlement.deleteSettlements(
      settlementIds
    );

    return AppResponse(req, res, StatusCodes.OK, {
      message: `${deletedSettlements.deletedCount} settlements deleted.`,
    });
  }

  async getSettlementsStats(req: Request, res: Response) {

    const data: {
      amountFrom: number
      amountTo?: number
      dateFrom?: Date
      dateTo?: Date
      driverId?: string,
    
    } = req.body


    const matchQuery: MatchQuery = {
      createdAt: { $gte: data.dateFrom, $lte: data.dateTo },

      amount: {
        $gte: data.amountFrom,
        ...(data?.amountTo && { $lte: data.amountTo })
      }
    }
    if (data?.driverId) {
      matchQuery.driverId = { $eq: data.driverId }
    }

    const query = {

      pipeline: [
        {
          $match: matchQuery
        },
        {
          $facet: {
            totalSettlementByFilter: [
              {
                $group: {
                  _id: null,
                  total: { $sum: "$amount" },
                  average: { $avg: "$amount" }
                }
              }
            ],

            monthlySplitByProcessor: [
              {
                $group: {
                  _id: {
                    month: { $month: "$createdAt" },
                    status: "$processor"
                  },
                  count: { $sum: 1 }
                }
              },
              {
                $group: {
                  _id: "$_id.month",
                  statusCounts: {
                    $push: {
                      k: "$_id.processor",
                      v: "$count"
                    }
                  }
                }
              },
              {
                $project: {
                  _id: 0,
                  month: "$_id",
                  statusCounts: {
                    $arrayToObject: "$statusCounts"
                  }
                }
              }
            ],

            monthlySplitByStatus: [
              {
                $group: {
                  _id: {
                    month: { $month: "$createdAt" },
                    status: "$status"
                  },
                  count: { $sum: 1 }
                }
              },
              {
                $group: {
                  _id: "$_id.month",
                  statusCounts: {
                    $push: {
                      k: "$_id.status",
                      v: "$count"
                    }
                  }
                }
              },
              {
                $project: {
                  _id: 0,
                  month: "$_id",
                  statusCounts: {
                    $arrayToObject: "$statusCounts"
                  }
                }
              }
            ],

            totalCommissionProfitsByMonth: [

            ], 
            totalSubscriptionsProfitsByMonth :  [

            ]
          }

        }
      ]
    }


    const result = await this.settlement.aggregateSettleements(query)

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Settlement data retrieved successfully",
      data: result
    })


  }

}




export const Settlement = new SettlementController(SettlementServiceLayer);

export default SettlementController;
