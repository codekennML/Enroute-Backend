import { UserServiceLayer } from './../services/userService';
import paystack from 'paystack';
import { MatchQuery, SortQuery } from "./../../types/types.d";

import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { ISettlements } from "../model/interfaces";
import SettlementService, {
  SettlementServiceLayer,
} from "../services/settlementService";
import AppResponse from "../utils/helpers/AppResponse";
import { Request, Response } from "express";
import { PAYSTACK_SECRET } from "../config/constants/payments";
import { webhooksLogger } from "../middlewares/logging/logger";

import { retryTransaction } from "../utils/helpers/retryTransaction";
import { ClientSession, Types } from "mongoose";
import AppError from "../middlewares/errors/BaseError";
import { sortRequest } from "../utils/helpers/sortQuery";
import User from "../model/user";
import { RideServiceLayer } from "../services/rideService";
import { Ride } from "../model/rides";
import { logEvents } from "../middlewares/errors/logger";
import { emailQueue } from "../services/bullmq/queue";
import { COMPANY_NAME } from "../config/constants/base";
import { CommissionDebitFailedMail } from "../views/mails/commissionFailedDebit";
import { CommissionDebitSuccesssMail } from "../views/mails/commissionSuccessDebit";
import PaystackPay from "../services/3rdParty/payments/paystack";
import crypto from "node:crypto"


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

  async initializeSettlementPayment(req: Request, res: Response) {

    const data: Omit<ISettlements, "status" | "processed" | "isPaymentInit"> & { isPaymentMethodInit: boolean } = req.body;

    // const { amount, processor, driverId, rides } = data;

    const newSettlement = await this._initializeSettlement(
      data
    );

    return AppResponse(req, res, StatusCodes.CREATED, {
      message: "Settlement data created successfully",
      data: {
        message: "Settlement initialized successfully",
        data: {
          settlement: newSettlement[0]._id,
          driverIdentifierMail: `${newSettlement[0]._id}@${COMPANY_NAME.toLowerCase()}.co`
        }

      },
    });
  }

  async _initializeSettlement(
    info: Omit<ISettlements, "status" | "processed" | "isPaymentInit"> & { isPaymentMethodInit: boolean }
  ) {


    const { amount, processor, driverId, rides, town, state, country, isPaymentMethodInit, driverEmail } = info;


    const newSettlement = await this.settlement.createSettlements({
      amount,
      processor,
      driverId,
      status: "created",
      processed: false,
      rides,
      town,
      state,
      country,
      isPaymentInit: isPaymentMethodInit,
      failedCount: 0,
      driverEmail
    });

    return newSettlement;

  }


  async SettlementsWebhookHandler(req: Request, res: Response) {
    const data = req.body
    //validate event
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(JSON.stringify(data))
      .digest("hex");

    const signature = req?.headers["x-paystack-signature"]

    if (!hash || !signature || hash !== signature)
      throw new AppError(
        getReasonPhrase(StatusCodes.UNAUTHORIZED),
        StatusCodes.UNAUTHORIZED,
        `Paystack Webhook event error - Foreign request detected / received`
      );

    const payload = req.body;

    // It's a good idea to log all received events.
    webhooksLogger.info(payload);

    //Reverify the webhook data
    const response = await PaystackPay.verifyTransactionById(payload.id);

    // if (response?.status !== "success") return res.status(200).end();

    //check if the settlement has been procesed earlier
    const tx_ref = response.data.reference as string;
    const isProcessed = await this.settlement.getSettlementsById(
      tx_ref,
      "processed"
    );

    if (!isProcessed) return res.status(404).end();

    if (isProcessed.processed) return res.status(200).end();

    if (response.data.event === "charge" && response.data.status === "failed")
      await retryTransaction(this.#handleFailedSettlementWebhooks, 1, response);

    if (
      response.data.event === "charge" &&
      response.data.status === "successful"
    )


      await retryTransaction(
        this.#handleSuccessfulSettlementWebhooks,
        1,
        response
      );

    res.status(200).end();
  }

  async #handleSuccessfulSettlementWebhooks(
    args: paystack.Response,
    session: ClientSession
  ) {
    const result = await session.withTransaction(async () => {
      //Update the settlement to successful

      const settlement = await this.settlement.updateSettlements({
        docToUpdate: { _id: args.data.reference },
        updateData: {
          processed: true,
          status: "success",
        },
        options: { new: true, select: "rides _id driverId isPaymentInit driverEmail", session },
      });

      if (!settlement)
        throw new AppError(
          getReasonPhrase(StatusCodes.NOT_FOUND),
          StatusCodes.NOT_FOUND
        );

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


      const shouldUpdatePaymentMethod = settlement?.data?.init
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
                isValid: true
              }
            }
          },
          options: { session }
        })
      }


      return settlement
    });

    const mail = CommissionDebitSuccesssMail(result.amount)

    emailQueue.add(`settlement_success_user_${result.driverId}_id${args.data.reference}`, {
      to: result.driverEmail,
      template: mail,
      subject: `Commission Charge Success  - ${new Date()} `,
      reply_to: `noreply@${COMPANY_NAME}.com`
    })



    return result._id
  }

  async #handleFailedSettlementWebhooks(
    args: paystack.Response,
    session: ClientSession
  ) {
    const result = await session.withTransaction(async () => {
      //Update the settlement to successful


      //Check the count for number of failures , if the failures count is less than three send an email for failed charge , then charge again ,  once the tries are up to three and it fails, set the status to failed , until the user adds a new payment method. once a new calc is added, charge immediately after checking ig there is a failed settlement to be made 

      const settlementInfo =
        await this.settlement.getSettlementsById(args.data.reference, "failedCount driverId")

      if (!settlementInfo || !settlementInfo?.failedCount) {

        logEvents("Error retrieving settlement for status update to failed", "errLog.log")
        throw new AppError(getReasonPhrase(StatusCodes.NOT_FOUND), StatusCodes.NOT_FOUND)
      }


      let settlementData


      if (settlementInfo.failedCount < 3) {

        settlementData = await this.settlement.updateSettlements({
          docToUpdate: { _id: args.data.reference },
          updateData: {
            $inc: { failedCount: 1 }
          },
          options: { new: true, select: "_id driverId driverEmail", session },
        });

        if (!settlementData || settlementData?.amount)
          throw new AppError(getReasonPhrase(StatusCodes.NOT_FOUND), StatusCodes.NOT_FOUND)

        const mail = CommissionDebitFailedMail(settlementData.amount)

        emailQueue.add(`settlement_failed_user_${settlementInfo.driverId}_id${args.data.reference}`, {
          to: settlementData?.driverEmail,
          template: mail,
          subject: "Commission Charge Failed ",
          reply_to: `noreply@${COMPANY_NAME}.com`
        })

      } else {
        settlementData = await this.settlement.updateSettlements({
          docToUpdate: { _id: args.data.reference },
          updateData: {
            processed: true,
            status: "failed",
          },
          options: { new: true, select: "_id", session },


        });

        await UserServiceLayer.updateUser({
          docToUpdate: { _id: settlementInfo.driverId },
          updateData: {
            "paymentMethod.isValid": false
          },
          options: { session }
        })
      }


      if (!settlementData)
        throw new AppError(
          getReasonPhrase(StatusCodes.NOT_FOUND),
          StatusCodes.NOT_FOUND
        );

      return settlementData._id;
    });

    return result;
  }

  async getSettlementsAdmin(req: Request, res: Response) {
    const data: SearchKeys = req.params;

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
    const data: SearchKeys = req.params;

    const { cursor, driverId } = data;

    const response = await this.#getSettlements({
      driverId: new Types.ObjectId(driverId),
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

  async #getSettlements(data: SearchKeys) {
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

    const hasData = result?.data?.length === 0;

    return {
      hasData,
      result,
    };
  }

  async getSingleSettlement(req: Request, res: Response) {
    const { id } = req.params;

    const settlement = await this.settlement.returnPopulatedSettlement({
      query: { _id: id },
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

    const hasData = settlement.length > 0;

    return AppResponse(
      req,
      res,
      hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
      {
        message: hasData
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
      dateFrom: Date
      dateTo: Date
      driverId: string
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
