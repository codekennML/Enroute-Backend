import { Flutterwave, MatchQuery, SortQuery } from "./../../types/types.d";

import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { ISettlements } from "../model/interfaces";
import SettlementService, {
  SettlementServiceLayer,
} from "../services/settlementService";
import AppResponse from "../utils/helpers/AppResponse";
import { Request, Response } from "express";
import { FLW_SECRET_HASH } from "../config/constants/payments";
import { webhooksLogger } from "../middlewares/logging/logger";
import FlutterwavePay from "../services/3rdParty/payments/flutterwave";
import { retryTransaction } from "../utils/helpers/retryTransaction";
import { ClientSession, Types } from "mongoose";
import AppError from "../middlewares/errors/BaseError";
import { sortRequest } from "../utils/helpers/sortQuery";
import User from "../model/user";

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
    const data: Omit<ISettlements, "status" | "processed"> = req.body;

    // const { amount, processor, driverId, rides } = data;

    const newSettlement = await this.#initializeSettlement(data);

    return AppResponse(req, res, StatusCodes.CREATED, {
      message: "Settlement data created successfully",
      data: {
        settlementId: newSettlement[0]._id,
      },
    });
  }

  async #initializeSettlement(
    data: Omit<ISettlements, "status" | "processed">
  ) {
    const { amount, processor, driverId, rides } = data;

    const newSettlement = await this.settlement.createSettlements({
      amount,
      processor,
      driverId,
      status: "created",
      processed: false,
      rides,
    });

    return newSettlement;
  }

  async addCardForSettlements(req: Request, res: Response) {}

  async calculateSettlementData(req: Request, res: Response) {
    const { driverId } = req.body;

    const unsettledRidesAndCommission = await RideServiceLayer.findRides([
      {
        $match: {
          driverId: driverId,
          status: "completed",
          commissionPaid: false,
        },
      },
      {
        $group: {
          _id: null,
          totalBill: { $sum: "$totalCommission" },
          documents: { $push: "$_id" },
        },
      },
      {
        $project: {
          _id: 0,
          totalBill: 1,
          documents: 1,
        },
      },
    ]);

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Settlement data retrieved successfully",
      data: {
        ...unsettledRidesAndCommission,
      },
    });
  }

  async SettlementsWebhookHandler(req: Request, res: Response) {
    // If you specified a secret hash, check for the signature
    const secretHash = FLW_SECRET_HASH;
    const signature = req.headers["verif-hash"];
    if (!signature || signature !== secretHash) {
      // This request isn't from Flutterwave; discard
      res.status(401).end();
    }

    const payload = req.body;

    // It's a good idea to log all received events.
    webhooksLogger.info(payload);

    //Reverify the webhook data
    const response = await FlutterwavePay.verifyTransactionById(payload.id);

    if (response?.status !== "success") return res.status(200).end();

    //check if the settlement has been procesed earlier
    const tx_ref = response.data.tx_ref as string;
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
    args: Flutterwave.Verification,
    session: ClientSession
  ) {
    const result = await session.withTransaction(async () => {
      //Update the settlement to successful

      const settlement = await this.settlement.updateSettlements({
        docToUpdate: { _id: args.data.tx_ref },
        updateData: {
          processed: true,
          status: "success",
        },
        options: { new: true, select: "rides _id", session },
      });

      if (!settlement)
        throw new AppError(
          getReasonPhrase(StatusCodes.NOT_FOUND),
          StatusCodes.NOT_FOUND
        );

      const updatedSettledRides = await RideServiceLayer.updateManyRides(
        rides,
        {
          settlementId: settlement._id,
          commissionPaid: true,
        },
        session
      );

      if (!updatedSettledRides)
        throw new AppError(
          getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
          StatusCodes.INTERNAL_SERVER_ERROR
        );

      return settlement._id;
    });

    return result;
  }
  async #handleFailedSettlementWebhooks(
    args: Flutterwave.Verification,
    session: ClientSession
  ) {
    const result = await session.withTransaction(async () => {
      //Update the settlement to successful

      const settlement = await this.settlement.updateSettlements({
        docToUpdate: { _id: args.data.tx_ref },
        updateData: {
          processed: true,
          status: "failed",
        },
        options: { new: true, select: "_id", session },
      });

      if (!settlement)
        throw new AppError(
          getReasonPhrase(StatusCodes.NOT_FOUND),
          StatusCodes.NOT_FOUND
        );

      return settlement._id;
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
          model: Rides,
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
}

export const Settlement = new SettlementController(SettlementServiceLayer);

export default SettlementController;
