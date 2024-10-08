import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import VehicleService, {
  VehicleServiceLayer,
} from "../services/vehicleService";
import { Request, Response } from "express";
import { ClientSession, Types } from "mongoose";
import { IVehicle } from "../model/interfaces";
import { retryTransaction } from "../utils/helpers/retryTransaction";
import AppResponse from "../utils/helpers/AppResponse";
import { MatchQuery } from "../../types/types";
import { sortRequest } from "../utils/helpers/sortQuery";
import { emailQueue } from "../services/bullmq/queue";
import { COMPANY_NAME, COMPANY_SLUG } from "../config/constants/base";
import { VehicleRejectedMail } from "../views/mails/vehicleRejected";
import { isNotAuthorizedToPerformAction } from "../utils/helpers/isAuthorizedForAction";
import { ROLES } from "../config/enums";

class VehicleController {
  private vehicle: VehicleService;

  constructor(service: VehicleService) {
    this.vehicle = service;
  }

  async changeVehicle(req: Request, res: Response) {
    //Everyy vehicle change will archive the current registered vehicle and create a new one , so every change must come with a document verification
    const data: Omit<
      IVehicle,
      "isVerified" | "isRejected" | "status" | "isArchived"
    > & { prevVehicleId?: string } = req.body;

    // const {
    //   driverId: user,
    //   vehicleMake,
    //   vehicleModel,
    //   year,
    //   insurance,
    //   inspection,
    //   hasAC,
    //   prevVehicleId,
    //   images,
    //   country,
    //   state


    // } = data;

    const changeVehicleSessionFn = async (
      args: typeof data,
      session: ClientSession
    ) => {
      const result = await session.withTransaction(async () => {
        if (args?.prevVehicleId) {
          const existingVerifiedVehicle = await this.vehicle.getVehicleById(
            args.prevVehicleId,
            "driverId isVerified"
          );

          if (
            !existingVerifiedVehicle ||
            existingVerifiedVehicle.driverId !== args.driverId
          )
            throw new AppError(
              getReasonPhrase(StatusCodes.NOT_FOUND),
              StatusCodes.NOT_FOUND
            );
        }
        //Do  a bulkwriite a t once and archive the prev existingVehicle

        const operations: Record<string, string | object>[] = [
          {
            insertOne: {
              document: {
                driverId: args.driverId,
                vehicleMake: args.vehicleMake,
                vehicleModel: args.vehicleModel,
                year: args.year,
                insurance: args.insurance,
                hasAC: args.hasAC,
                inspection: args.inspection,
                isVerified: false,
                status: "pending",
                isRejected: false,

              },
            },
          },
        ];

        if (args.prevVehicleId) {
          operations.push({
            updateOne: {
              filter: { _id: args.prevVehicleId },
              update: {
                isArchived: true,
              },
            },
          });
        }

        const result = await this.vehicle.bulkWriteVehicles(
          { operations },
          session
        );
        return result;
      });

      return result;
    };

    const response = await retryTransaction(changeVehicleSessionFn, 1, data);

    return AppResponse(req, res, StatusCodes.OK, {
      message: `New vehicle ${response.insertedIds[0]} created`,
    });
  }

  async approveVehicleChange(req: Request, res: Response) {

    const { vehicleId, } = req.body;

    if ([ROLES.DRIVER, ROLES.RIDER].includes(req.role) || isNotAuthorizedToPerformAction(req)) throw new AppError("Insufficient permissions", StatusCodes.FORBIDDEN);

    const approvedVehicle = await this.vehicle.updateVehicle({
      docToUpdate: { _id: vehicleId },
      updateData: {
        $set: {
          isVerified: true,
          approvedBy: new Types.ObjectId(req.user),
          status: "assessed",
        },
      },
      options: { new: true, select: "_id" },
    });

    if (!approvedVehicle)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: `Vehicle ${approvedVehicle._id} has been approved.`,
    });
  }

  async rejectVehicleChange(req: Request, res: Response) {
    const data: { vehicleId: string; userEmail: string } = req.body;

    const {
      vehicleId,
      // userEmail
    } = data;

    if ([ROLES.DRIVER, ROLES.RIDER].includes(req.role) || isNotAuthorizedToPerformAction(req)) throw new AppError("Insufficient permissions", StatusCodes.FORBIDDEN);


    const rejectedVehicle = await this.vehicle.updateVehicle({
      docToUpdate: { _id: data.vehicleId },
      updateData: {
        $set: {
          isVerified: false,
          isRejected: true,
          status: "assessed",
        },
      },
      options: { new: true, select: "_id vehicleMake vehicleModel licensePlate " },
    });

    if (!rejectedVehicle)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const template = VehicleRejectedMail(rejectedVehicle)
    //TODO Send an email to the driver here using the userEmail
    emailQueue.add(`Vehicle_Rejected_${vehicleId}`, {
      subject: `${COMPANY_NAME} - Vehicle Rejected`,
      template,
      to: data.userEmail,
      from: `info@${COMPANY_SLUG}`
    })

    return AppResponse(req, res, StatusCodes.OK, {
      message: `Vehicle ${rejectedVehicle._id} has been rejected.`,
    });
  }

  //Admins only
  async deleteVehicles(req: Request, res: Response) {
    const data: { vehicleIds: string[] } = req.body;

    const { vehicleIds } = data;

    if (vehicleIds.length === 0)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const deletedVehicles = await this.vehicle.deleteVehicles(vehicleIds);

    return AppResponse(req, res, StatusCodes.OK, {
      message: `${deletedVehicles.deletedCount} vehicle deleted.`,
    });
  }

  async getVehicles(req: Request, res: Response) {
    const data: Partial<IVehicle> & {
      vehicleId?: string;
      cursor?: string;
      sort?: string;
    } = req.params;

    const { isVerified, status, vehicleId, isArchived } =
      data;

    const matchQuery: MatchQuery = {};

    if (vehicleId) {
      matchQuery._id = { $eq: vehicleId };
    }

    if (data?.cursor) {
      matchQuery._id = { $lte: data.cursor };
    }

    if (isArchived) {
      matchQuery.isArchived = { $eq: isArchived };
    }

    if (isVerified) {
      matchQuery.isVerified = { $eq: isVerified };
    }

    if (status) {
      matchQuery.status = { $eq: status };
    }

    const sortQuery = sortRequest(data?.sort);

    const query = {
      query: matchQuery,
      aggregatePipeline: [sortQuery, { $limit: 101 }],
      pagination: {
        pageSize: 100,
      },
    };

    const response = await this.vehicle.getVehicles(query);

    const hasData = response?.data?.length;

    return AppResponse(
      req,
      res,
      hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
      {
        message: hasData
          ? `Vehicles retrieved successfully`
          : `No vehicles found for this request`,
        data: response,
      }
    );
  }
}

export const Vehicle = new VehicleController(VehicleServiceLayer);

export default Vehicle;
