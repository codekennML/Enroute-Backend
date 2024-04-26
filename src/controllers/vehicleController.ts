import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import VehicleService, {
  VehicleServiceLayer,
} from "../services/vehicleService";
import { Request, Response } from "express";
import { ClientSession } from "mongoose";
import { IVehicle } from "../model/interfaces";
import { retryTransaction } from "../utils/helpers/retryTransaction";
import AppResponse from "../utils/helpers/AppResponse";
import { MatchQuery } from "../../types/types";
import { sortRequest } from "../utils/helpers/sortQuery";

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

    const {
      driverId: user,
      vehicleMake,
      vehicleModel,
      year,
      insurance,
      inspection,
      hasAC,
      prevVehicleId,
      town,
      state,
      country,
    } = data;

    const changeVehicleSessionFn = async (
      args: typeof data,
      session: ClientSession
    ) => {
      const result = await session.withTransaction(async () => {
        if (prevVehicleId) {
          const existingVerifiedVehicle = await this.vehicle.getVehicleById(
            prevVehicleId,
            "driverId isVerified"
          );

          if (
            !existingVerifiedVehicle ||
            existingVerifiedVehicle.driverId !== user
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
                driverId: user,
                vehicleMake,
                vehicleModel,
                year: year,
                insurance,
                hasAC,
                inspection,
                isVerified: false,
                status: "pending",
                isRejected: false,
                town,
                state,
                country,
              },
            },
          },
        ];

        if (prevVehicleId) {
          operations.push({
            updateOne: {
              filter: { _id: prevVehicleId },
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
    const { vehicleId, adminId } = req.body;

    const approvedVehicle = await this.vehicle.updateVehicle({
      docToUpdate: { _id: vehicleId },
      updateData: {
        $set: {
          isVerified: true,
          approvedBy: adminId,
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

    const approvedVehicle = await this.vehicle.updateVehicle({
      docToUpdate: { _id: vehicleId },
      updateData: {
        $set: {
          isVerified: false,
          isRejected: true,
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

    //TODO Send an email to the driver here using the userEmail

    return AppResponse(req, res, StatusCodes.OK, {
      message: `Vehicle ${approvedVehicle._id} has been approved.`,
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

    const { isVerified, status, vehicleId, isArchived, town, country, state } =
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

    if (country) {
      matchQuery.country = { $eq: country };
    }

    if (state) {
      matchQuery.state = { $eq: state };
    }
    if (town) {
      matchQuery.town = { $eq: town };
    }

    if (status) {
      matchQuery.status = { $eq: town };
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
