import { MatchQuery, SortQuery } from "./../../types/types.d";
import { IPackageSchedule } from "../model/interfaces";
import { Request, Response } from "express";
import PackageScheduleService, {
  PackageScheduleServiceLayer,
} from "../services/packageScheduleService";
import { Types } from "mongoose";
import AppResponse from "../utils/helpers/AppResponse";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { sortRequest } from "../utils/helpers/sortQuery";
import AppError from "../middlewares/errors/BaseError";
import { cronEventsLogger } from "../middlewares/logging/logger";

class PackageSchedule {
  private packageSchedule: PackageScheduleService;

  constructor(service: PackageScheduleService) {
    this.packageSchedule = service;
  }

  async createPackageSchedule(req: Request, res: Response) {
    const data: Omit<IPackageSchedule, "status" | "createdBy"> & {
      createdBy: string;
    } = req.body;

    const {
      type,
      budget,
      summary,
      dueAt,
      expiresAt,
      pickupAddress,
      destinationAddress,
      destinationTown,
      destinationState,
      pickupTown,
      pickupState,
      pickupCountry,
    } = data;

    const createdPackageSchedule =
      await this.packageSchedule.createPackageSchedule({
        createdBy: new Types.ObjectId(data.createdBy),
        type,
        budget,
        summary,
        dueAt,
        expiresAt,
        pickupAddress,
        destinationAddress,
        destinationTown,
        destinationState,
        pickupTown,
        pickupState,
        pickupCountry,
        status: "created",
      });

    return AppResponse(req, res, StatusCodes.CREATED, {
      message: "Package Schdeule created successfully",
      data: createdPackageSchedule,
    });
  }

  async getPackageSchedules(req: Request, res: Response) {
    const data: {
      packageScheduleId: string;
      cursor: string;
      pickupTown: string;
      destinatonTown: string;
      country: string;
      sort: string;
      expiresAt: Date;
      budget?: {
        max: number;
        min: number;
      };
      type: string;
    } = req.body;

    const matchQuery: MatchQuery = {};

    if (data?.country) {
      matchQuery.country = { $eq: data.country };
    }

    // if (data?.pickuptown) {
    //   (matchQuery.destination as Record<string, unknown>).placeId = {
    //     $eq: destination,
    //   };
    // }

    if (data?.budget && data.budget.max) {
      matchQuery.budget = { $lte: data.budget.max };
    }
    if (data?.budget && data.budget.min) {
      matchQuery.budget = { $gte: data.budget.min };
    }

    if (data?.destinatonTown) {
      matchQuery.destinationTown = { $eq: data?.destinatonTown };
    }

    if (data?.pickupTown) {
      matchQuery.destinationTown = { $eq: data?.destinatonTown };
    }

    if (data?.expiresAt) {
      matchQuery.expiresAt = { $gte: data.expiresAt };
    }

    const sortQuery: SortQuery = sortRequest(data?.sort);

    if (data?.cursor) {
      const orderValue = Object.values(sortQuery)[0] as unknown as number;

      const order =
        orderValue === 1 ? { $gt: data.cursor } : { $lt: data?.cursor };

      matchQuery._id = order;
    }

    const query = {
      query: matchQuery,
      aggregatePipeline: [sortQuery, { $limit: 101 }],
      pagination: { pageSize: 100 },
    };

    const result = await this.packageSchedule.findPackageSchedules(query);

    const hasData = result?.data?.length === 0;

    return AppResponse(
      req,
      res,
      hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
      {
        message: hasData
          ? `Schedules retrieved succesfully`
          : `No packages schedules were found for this request `,
        data: result,
      }
    );
  }

  async getPackageScheduleById(req: Request, res: Response) {
    const packageScheduleId: string = req.params.id;

    const result = await this.packageSchedule.getPackageScheduleById(
      packageScheduleId
    );

    if (!result)
      throw new AppError(
        "No schedule was found for this request",
        StatusCodes.NOT_FOUND
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Bus station retrieved successfully",
      data: result,
    });
  }

  async deleteSchedule(req: Request, res: Response) {
    const { scheduleId } = req.body;

    const user = req.user;

    const scheduleData = await this.packageSchedule.getPackageScheduleById(
      scheduleId
    );

    if (scheduleData?.createdBy.toString() !== user)
      throw new AppError(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );

    const deletedPackageSchedule =
      await this.packageSchedule.deletePackageSchedules([scheduleId]);

    return AppResponse(req, res, StatusCodes.OK, {
      message: `${deletedPackageSchedule.deletedCount} package schedule -  ${scheduleId} -  deleted successfully.`,
    });
  }

  //Admin only
  async deletePackageSchedule(req: Request, res: Response) {
    const data: { scheduleIds: string[] } = req.body;

    const { scheduleIds } = data;

    if (scheduleIds.length === 0)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const deletedBusStations =
      await this.packageSchedule.deletePackageSchedules(scheduleIds);

    return AppResponse(req, res, StatusCodes.OK, {
      message: `${deletedBusStations.deletedCount} bus stations deleted.`,
    });
  }

  async cleanExpiredPackageSchedules() {
    //Cron JOB //Every hour
    const result = await this.packageSchedule.deletePackageSchedules({
      expiresAt: { $lte: Date.now() },
    });

    cronEventsLogger.info(
      `${result.deletedCount} expires package schedules cleaned - CRON `
    );

    return;
  }
}

const packageSchedule = new PackageSchedule(PackageScheduleServiceLayer);

export default packageSchedule;
