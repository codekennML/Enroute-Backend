import { MatchQuery, SortQuery } from "./../../types/types.d";
import { IPackageSchedule } from "../model/interfaces";
import { Request, Response } from "express";
import PackageScheduleService, {
  PackageScheduleServiceLayer,
} from "../services/packageScheduleTripService";
import { Types } from "mongoose";
import AppResponse from "../utils/helpers/AppResponse";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { sortRequest } from "../utils/helpers/sortQuery";
import AppError from "../middlewares/errors/BaseError";
import { cronEventsLogger } from "../middlewares/logging/logger";
import { ROLES } from "../config/enums";

//This controller is used by a user to create  a schedule for a packag they want to send

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
      packageDetails,
      dueAt,
      expiresAt,
      pickupAddress,
      destinationAddress,
      totalDistance
    } = data;


    if(req.user !== data?.createdBy && req.role in [ROLES.RIDER, ROLES.DRIVER]) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)

    const createdPackageSchedule =
      await this.packageSchedule.createPackageSchedule({
        createdBy: new Types.ObjectId(data.createdBy),
        type,
        budget,
        packageDetails,
        dueAt,
        expiresAt,
        pickupAddress,
        destinationAddress,
        status: "created",
        totalDistance
      });

    return AppResponse(req, res, StatusCodes.CREATED, {
      message: "Package Schdeule created successfully",
      data: createdPackageSchedule,
    });
  }

  async getPackageSchedules(req: Request, res: Response) {
    const data: {
      riderCoordinates? : [number, number],
      packageScheduleId?: string;
      cursor?: string;
      pickupTown?: string;
      destinationTown?: string;
      country?: string;
      sort?: string;
      expiresAt?: Date;
      budget?: {
        max: number;
        min: number;
      };
      type?: string;
      user : string
    } = req.body;



    const matchQuery: MatchQuery = {};


    if(data?.user && req.role in [ROLES.DRIVER, ROLES.RIDER]){
       matchQuery.createdBy =  { $eq : new Types.ObjectId(req.user)}
    }

    if (data?.country) {
      matchQuery.country = { $eq: data.country };
    }

    if(data?.user){ 
      matchQuery.createdBy =  { $eq : data.user} 
    }


    if (data?.budget && data.budget.max) {
      matchQuery.budget = { $lte: data.budget.max };
    }

    if (data?.budget && data.budget.min) {
      matchQuery.budget = { $gte: data.budget.min };
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

   const aggregatePipeline =  []
      //This is a rider searching for package schedules to make offers to
   if(data?.riderCoordinates){ 
      aggregatePipeline.push(...[ 
         { 
          $geoNear: {
             near: {
               type: "Point",
               coordinates: data.riderCoordinates } ,
              maxDistance: 3000,
              query : matchQuery,
              distanceField : "dist.calculated"
       } 
    }, 
     { $limit: 101 }
  ])  
} else {
     aggregatePipeline.push(...[
        sortQuery,
       { $limit: 101 }
      ])
  }


    const query = {
      query: matchQuery,
      aggregatePipeline,
      pagination: { pageSize: 100 },
    };

  


    if(data?.riderCoordinates){
     const  result =  await this.packageSchedule.aggregatePackageSchedules({
    //@ts-expect-error ts has an issue differentiating types of aggregatePipeline
        pipeline : aggregatePipeline 
      })

      return AppResponse(
        req,
        res,
        result.length > 0 ? StatusCodes.OK : StatusCodes.NOT_FOUND,
        {
          message: result.length > 0
            ? `Schedules retrieved succesfully`
            : `No packages schedules were found for this request `,
          data: result,
        }
      );

    }  else { 
      //@ts-expect-error ts has an issue differentiating types of aggregatePipeline
     const result = await this.packageSchedule.findPackageSchedules(query)
      return AppResponse(
        req,
        res,
        result.data.length > 0 ? StatusCodes.OK : StatusCodes.NOT_FOUND,
        {
          message: result.data.length > 0
            ? `Schedules retrieved succesfully`
            : `No packages schedules were found for this request `,
          data: result,
        }
      );

  }
  
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

  async cancelSchedule(req: Request, res: Response) {
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

    const cancelledPackageSchedule =
      await this.packageSchedule.updatePackageSchedule({
        docToUpdate : { _id : scheduleId }, 
        updateData : { 
          $set : { status : "cancelled "}
        }, 
        options : { new : true, select :"_id"}
      }); 

      if(!cancelledPackageSchedule) throw new AppError(`Something went wrong. Please try again`, StatusCodes.INTERNAL_SERVER_ERROR)

    return AppResponse(req, res, StatusCodes.OK, {
      message: ` Package schedule -  ${scheduleId} -  cancelled successfully.`,
    });
  }

  //Admin only
  async deletePackageSchedules(req: Request, res: Response) {

    const data: { scheduleIds: string[] } = req.body;

    const { scheduleIds } = data;

    if (scheduleIds.length === 0)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const deletedPackageSchedules =
      await this.packageSchedule.deletePackageSchedules(scheduleIds);

      

    return AppResponse(req, res, StatusCodes.OK, {
      message: `${deletedPackageSchedules.deletedCount} package schedules deleted.`,
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

  async getPackageScheduleStats(req : Request , res : Response) { 
    const data: {
      dateFrom?: Date,
      dateTo?: Date,
      country?: string,
      state?: string,
      town?: string,
      minBudget? : string, 
      maxBudget? : string,
      type?  : "HTH" | "STS"

    } = req.body

    const matchQuery: MatchQuery = {

    };

    if(data?.dateFrom){
      matchQuery.createdAt =  { 
        $gte: new Date(data.dateFrom),
        $lte: data?.dateTo ?? new Date(Date.now()) 
      }
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

    if(data?.minBudget){
      matchQuery.budget = { $gte: data.minBudget }
    }

    if(data?.maxBudget){
      matchQuery.budget = { $gte: data.maxBudget }
    }

    const query = {
      pipeline: [
        { $match: matchQuery },
        {
          $facet: {
            count: [{ $count: "total" }],
            getScheduleCountByStatus: [
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 }
                }
              }
            ],
            getCountsByType : [ 
              { 
                $group : { 
                  _id : "$type",
                  count : {$sum : 1}
                }
              }
            ],
            averageAcceptedBudgetFare: [
              {
                $group: {
                  _id: null,
                  average: { $avg: "$paidFare" }
                }
              }
            ],
            dueToday : [
              { 
                group : { 
                  count : { $sum : { $cond : [ {$lte : ["$$expiresAt",  new Date(Date.now()) ]}] }}
                }
              }
            ]

          }
        }
      ]
    };

    //@ts-expect-error //ts doesnt recognize the stage correctly
    const result = await this.ride.aggregateRides(query)

    return AppResponse(req, res, StatusCodes.OK, result)


  }
}

export const packageSchedule = new PackageSchedule(PackageScheduleServiceLayer);

export default packageSchedule;
