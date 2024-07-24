import { MatchQuery, SortQuery } from "./../../types/types.d";
import { IPackageScheduleRequest } from "../model/interfaces";
import { Request, Response } from "express";
import PackageScheduleRequestService, {
  PackageScheduleRequestServiceLayer,
} from "../services/packageScheduleRequestService";
import { ClientSession, Types } from "mongoose";
import AppResponse from "../utils/helpers/AppResponse";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { sortRequest } from "../utils/helpers/sortQuery";
import AppError from "../middlewares/errors/BaseError";
import { cronEventsLogger } from "../middlewares/logging/logger";
import { UserServiceLayer } from "../services/userService";
import { PackageScheduleServiceLayer } from "../services/packageScheduleTripService";
// import CommunicationService from "../services/communicationService";
import { retryTransaction } from "../utils/helpers/retryTransaction";
import { pushQueue } from "../services/bullmq/queue";

class PackageScheduleRequestController {
  private packageScheduleRequest: PackageScheduleRequestService;

  constructor(service: PackageScheduleRequestService) {
    this.packageScheduleRequest = service;
  }

  async createPackageScheduleRequest(req: Request, res: Response) {
    const data: Omit<
      IPackageScheduleRequest,
      "status" | "createdBy" | "packageScheduleId"
    > & { packageScheduleId: string } = req.body;

    const user = req.user;

    const response = await retryTransaction(
      this._createPackageRequestSession,
      1,
      {
        user: user!.toString(),
        ...data,
      }
    );

    return AppResponse(req, res, StatusCodes.CREATED, {
      message: "Package Schedule  request created successfully",
      data: response[0],
    })
  }

  async _createPackageRequestSession(
    args: {
      user: string;
      body: string;
      budget: number;
      packageScheduleId: string;
    },
    session: ClientSession
  ) {
    const result = await session.withTransaction(async () => {
      const { packageScheduleId, user, budget, body } = args;
      //Get the package schedule

      const schedule = await PackageScheduleServiceLayer.getPackageScheduleById(
        packageScheduleId,
        "userId budget",
        session
      );

      if (!schedule)
        throw new AppError(
          `Something went wrong. Please try again later`,
          StatusCodes.NOT_FOUND,
          `Error fetching schedule ${packageScheduleId} data for package schedule request 
      `
        );

      if (schedule.budget > budget)
        throw new AppError(
          "Budget cannot be less than the users minimum budget",
          StatusCodes.BAD_REQUEST
        );

      const createdPackageScheduleRequest =
        await this.packageScheduleRequest.createPackageScheduleRequest(
          {
            createdBy: new Types.ObjectId(user!.toString()),
            budget,
            body,
            status: "created",
            packageScheduleId: new Types.ObjectId(packageScheduleId),
          },
          session
        );

      //Send a notification to the scheduler that their package has a new request

      const scheduleCreator = await UserServiceLayer.getUserById(
        schedule.createdBy.toString(),
        "deviceToken",
        session
      );

      if (!scheduleCreator)
        throw new AppError(
          `Something went wrong. Please try again later`,
          StatusCodes.NOT_FOUND,
          `Error fetching package schedule creator data data for package schedule request notification 
`
        );

        pushQueue.add(`PACKAGE_SCHEDULE_REQUEST_${args.packageScheduleId}_${createdPackageScheduleRequest[0]._id}`,  {
          deviceTokens : scheduleCreator.deviceToken, 
          message : { 
            title : 'New package schedule request offer',
            body : `You have received a new offer of ${args.budget}   for one of your scheduled packages  `,
            screen : "package/:id", 
            id : `${args.packageScheduleId}`
          }
        }, { priority : 7})

    
      return createdPackageScheduleRequest;
    });

    return result;
  }

  async approvePackageScheduleRequest(req: Request, res: Response) {

    //Once a package request is approved, it becomes a ride request of type package, assignable to a trip

    const { packageRequestId, packageScheduleId } = req.body;

    const user = req.user;

    const schedule = await PackageScheduleServiceLayer.getPackageScheduleById(
      packageScheduleId,
      "createdBy"
    );

    if (
      !schedule ||
      !schedule.createdBy ||
      schedule?.createdBy.toString() !== user!.toString()
    )
      throw new AppError(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN,
        `Illegal attempt to approve scheduleRequest by user ${user}`
      );


      const hasAnAssignedRequest  = await this.packageScheduleRequest.findPackageScheduleRequests({ 
        query : {
          $match : { 
            packageScheduleId , 
            status : "accepted"
          }
        }, 
        aggregatePipeline : [
          { $limit : 2}
        ],
        pagination : { 
          pageSize : 1 
        }
      })

      if(!hasAnAssignedRequest?.data?.length || hasAnAssignedRequest?.data?.length > 0 ) throw new AppError(`This schedule  has already been assigned to another driver`, StatusCodes.FORBIDDEN)


    const approvedRequest =
      await this.packageScheduleRequest.updatePackageScheduleRequest({
        docToUpdate: {
          _id: packageRequestId,
        },
        updateData: {
          status: "accepted",
        },
        options: { new: true, select: "_id" },
      });



    if (!approvedRequest)
      throw new AppError(
        "Something went wrong",
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Error approving package schedule request for package schedule ${packageScheduleId}`
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Request approved successfully",
      data: { requestId: approvedRequest?._id },
    });
  }

  async getPackageScheduleRequests(req: Request, res: Response) {
    const data: {
      packageScheduleId: string;
      cursor: string;
      sort: string;
      status: string;
      budget?: {
        max: number;
        min: number;
      };
      dateFrom? : Date, 
      dateTo? : Date
    } = req.body;

    const matchQuery: MatchQuery = {};

    if (data?.status) {
      matchQuery.country = { $eq: data.status };
    }

 
    if (data?.dateFrom) {
      matchQuery.createdAt = { $gte: new Date(data.dateFrom), $lte: data?.dateTo ?? new Date(Date.now()) };
    }

    if (data?.budget && data.budget.max) {
      matchQuery.budget = { $lte: data.budget.max };
    }
    if (data?.budget && data.budget.min) {
      matchQuery.budget = { $gte: data.budget.min };
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

    const result =
      await this.packageScheduleRequest.findPackageScheduleRequests(query);

    const hasData = result?.data?.length === 0;

    return AppResponse(
      req,
      res,
      hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
      {
        message: hasData
          ? `Schedule  request  retrieved succesfully`
          : `No packages schedule requests were found for this request `,
        data: result,
      }
    );
  }

  async getPackageScheduleRequestById(req: Request, res: Response) {
    const packageScheduleRequestId: string = req.params.id;

    const result =
      await this.packageScheduleRequest.getPackageScheduleRequestById(
        packageScheduleRequestId
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

  async cancelScheduleRequest(req: Request, res: Response) {

    const { scheduleRequestId } = req.body;

    const user = req.user;

    const scheduleData = await this.packageScheduleRequest.getPackageScheduleRequestById(
      scheduleRequestId
    );

    if (scheduleData?.createdBy.toString() !== user)
      throw new AppError(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );

    if (scheduleData?.createdBy.toString() !== user)
      throw new AppError(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );


    const cancelledPackageScheduleRequest =
      await this.packageScheduleRequest.updatePackageScheduleRequest({
        docToUpdate: { _id: scheduleRequestId },
        updateData: {
          $set: { status: "cancelled " }
        },
        options: { new: true, select: "_id" }
      }); 

    if (!cancelledPackageScheduleRequest) throw new AppError(`Something went wrong. Please try again`, StatusCodes.INTERNAL_SERVER_ERROR)


    return AppResponse(req, res, StatusCodes.OK, {
      message: `Package schedule -  ${scheduleRequestId} -  cancelled successfully.`,
    });
  }

  //Admin only
  async deletePackageScheduleRequests(req: Request, res: Response) {
    const data: { scheduleRequestIds: string[] } = req.body;

    const { scheduleRequestIds } = data;

    if (scheduleRequestIds.length === 0)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const deletedPackageScheduleRequests =
      await this.packageScheduleRequest.deletePackageScheduleRequests(
        scheduleRequestIds
      );

    if(!deletedPackageScheduleRequests) throw new AppError(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR), StatusCodes.INTERNAL_SERVER_ERROR)

    return AppResponse(req, res, StatusCodes.OK, {
      message: `${deletedPackageScheduleRequests.deletedCount} schedule requests deleted.`,
    });
  }

  async cleanRejectedPackageScheduleRequests() {
    //Cron JOB //Every hour
    const result =
      await this.packageScheduleRequest.deletePackageScheduleRequests({
        status: { $eq: "rejected" },
      });

    cronEventsLogger.info(
      `${result.deletedCount} expired package schedules cleaned - CRON `
    );

    return;
  }
  
}

export const PackageScheduleRequest = new PackageScheduleRequestController(
  PackageScheduleRequestServiceLayer
);

export default PackageScheduleRequest;
