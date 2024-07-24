import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import TripScheduleService, {
    tripScheduleServiceLayer,
} from "../services/tripScheduleService";
import { Request, Response } from "express";
import { ITripSchedule } from "../model/interfaces";
import AppResponse from "../utils/helpers/AppResponse";
import { MatchQuery, SortQuery } from "../../types/types";
import { sortRequest } from "../utils/helpers/sortQuery";
import { ROLES } from "../config/enums";

import { RideRequestServiceLayer } from "../services/rideRequestService";
import { batchPushQueue } from "../services/bullmq/queue";
import { VehicleServiceLayer } from "../services/vehicleService";
import { DocumentsServiceLayer } from "../services/documentsService";
import { ClientSession } from "mongoose";
import { retryTransaction } from "../utils/helpers/retryTransaction";

class TripScheduleController {
    private TripSchedule: TripScheduleService;

    constructor(service: TripScheduleService) {

        this.TripSchedule = service;
    }

    async createTripSchedule(req: Request, res: Response) {
       
        const data: Omit<ITripSchedule, "status"> = req.body;


        const tripSchedulesCount = await this.TripSchedule.aggregateTripSchedules([
            {
                $match: {
                    driverId: data.driverId,
                    status: "created",
                },
            },
            {
                $unwind: "$$tripData",
            },
            // Match trips based on departureTime within a specified time interval
            {
                $match: {
                    "tripData.departureTime": {
                        $gte: "$tripData.departureTime",
                        $lte: { $add: ["$tripData.departureTime", 15000] }, // Adding 15000 milliseconds (15 minutes)
                    },
                },
            },
            // Group and count the number of matching trips
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 }, // Count the number of matching trips
                },
            },
            // Project to reshape the output (optional)
            {
                $project: {
                    _id: 0, // Exclude _id field
                    total: 1, // Include total field
                },
            },
        ]);

        const canCreateNewRideScheduleToDestination =
            tripSchedulesCount?.length > 0 && tripSchedulesCount[0].total <= 1;

        if (!canCreateNewRideScheduleToDestination)
            throw new AppError(
                `A maximum of 1 trip schedule can be created within an interval of 15 minutes.`,
                StatusCodes.FORBIDDEN
            );

            //Check  if the vehicle papers will be expired by then and throw an error 

            const vehicle  =  await VehicleServiceLayer.findVehicles({
                query : { driverId : { $eq: req.user}, isArchived : false, isVerified : true, status : "assessed",  "insurance.expiryDate" : { $gte : data.departureTime,  "inspection.expiry": {$gte : data.departureTime} }  }, 
                select : "_id"
            })

            if(!vehicle) throw new AppError("An error occurred. Please try again", StatusCodes.INTERNAL_SERVER_ERROR)

            if(vehicle?.length > 0 ) throw new AppError(`One of the required documents would have expired before this proposed trip. Please schedule a trip within the timeframe of your documents validity or update your documents to proceed.`, StatusCodes.FORBIDDEN)

          //Finally 

          //Check if the users driver license will expire before that day 

          const documents = await DocumentsServiceLayer.getDocumentsWithPopulate({
            query : { 
                userId : { $eq : req.user}, 
                name : "license",
                isVerified : true, 
                status : "assesed", 
                archived : false,
                expiry : {$lte : data.departureTime}
            }, select : "_id"
          })

          if(!documents) throw new AppError("An error occurred. Please try again later", StatusCodes.NOT_FOUND)
        
        if(documents.length === 0 ) throw new AppError("Your driver license will expire before this proposed trip. Please schedule a trip within the timeframe of its validity or update your license to proceed", StatusCodes.FORBIDDEN) 


        const createdTripSchedule = await this.TripSchedule.createTripSchedule({...data,  status : "created" as const});

        return AppResponse(req, res, StatusCodes.CREATED, {
            message: "Trip schedule created successfully",
            data: createdTripSchedule,
        });
    }

    async updateTripDepartureTime(req : Request, res : Response) {
    
        const data: {tripScheduleId : string, departureTime : Date } =  req.body 


        if(data.departureTime <= new Date(Date.now() + 15 * 60 * 1000)) throw new AppError("The new departure time must be atleast 20mins from now.", StatusCodes.FORBIDDEN)

        const updatedTripSchedule =  await tripScheduleServiceLayer.updateTripSchedule({ 
            docToUpdate : {_id : data.tripScheduleId}, 
            updateData : {
                departureTime : new Date()
            },
            options : { new : true, select : "_id "}
        })

        if(!updatedTripSchedule) throw new AppError("An Error occurred. Please try again",  StatusCodes.INTERNAL_SERVER_ERROR)

  
       const ridesInfo =  await RideRequestServiceLayer.aggregateRideRequests([ 
        { 
            $match : { tripScheduleId : data.tripScheduleId }
        }, 
      
        {
            $project : { 
                 riderId : 1 ,
                 _id : 1
            }
        }, 
        { 
            $lookup : { 
                from : "users" ,
                localField : "riderId", 
                foreignField : "_id", 
                pipeline : [
{
    $project : { 
        deviceToken : 1 
    }
}
                ], 
                as : "riderPushId"
            }
        }, 
             {
               $unwind: "$riderPushId"
           }, 

              {
               $lookup: {
                   from: "users",
                   localField: "driverId",
                   foreignField: "_id",
                   pipeline: [
                       {
                           $project: {
                               firstName: 1,
                               lastName : 1 , 
                               _id : 1

                           }
                       }
                   ],
                   as: "driverData"
               }, 
            }, { 
                  $unwind: "$driverData"
            }, 
           {
               $lookup: {
                   from: "tripSchedules",
                   localField: "tripScheduleId",
                   foreignField: "_id",
                   pipeline: [
                       {
                           $project: {
                               departureTime: 1
                           }
                       }
                   ],
                   as: "scheduleDepartureTime"
               }
           },
           {
               $unwind: "$scheduledDepartureTime"
           }, 
          
            {
              $project : { 
                ridersPushId : 1, 
                driverData: 1 , 
                scheduledDepartureTime : 1,
                _id : 1
                
              }
            }
        
       ])
        
       if(!ridesInfo) throw new AppError("We were able to find any scheduled trip matching the request", StatusCodes.NOT_FOUND)
       
        if(ridesInfo.length === 0 ) {

            //The trip schedule has no ride request 
            return AppResponse(req, res, StatusCodes.OK, { 
                message : "Trip Schedule departure time updated successfully",

            })
        }


        const pushMessages = ridesInfo[0]?.map((riderData: { _id: string; riderPushId: string; driverData: { firstName: string; lastName: string; _id : string}; }) => ({
        name : `Trip_schedule_departure_update_${data.tripScheduleId}_${riderData._id}`, 
        data : {
            deviceToken: riderData.riderPushId,
            message: {
                body: `THe departure time for your scheduled trip with ${riderData.driverData.firstName} ${riderData.driverData.lastName} on ${ridesInfo[0][0]?.scheduledDepartureTime.toLocaleDateString()} has been updated to ${data.departureTime.toLocaleDateString}. If this change does align with your schedule, you can  cancel and book to ride with another driver at no extra cost`,
                screen: `rideRequest`,
                driverId : riderData.driverData._id,
                id: riderData._id
            }
        },
      opts :   { 
          removeonFail : true, 
          removeOnComplete : true,
          priority : 6
        }
         }))

       await batchPushQueue.addBulk(pushMessages)

       return AppResponse(req, res, StatusCodes.OK, {
       message : "Trip schedule departure time updated successfully", data : { _id : data.tripScheduleId } 
       })


        //Get 
    }

    cancelTripSchedule =  async(req : Request, res : Response) => {

        const data: {tripScheduleId : string } =  req.body 


        const cancelSession =  async (args : {tripScheduleId : typeof data["tripScheduleId"] }, session : ClientSession) => {  
   

          const result =    await session.withTransaction(async()=> { 

            const cancelledTripSchedule =  await tripScheduleServiceLayer.updateTripSchedule({ 
                docToUpdate : {_id : args.tripScheduleId}, 
                updateData : {
                    status : "cancelled"
                },
                options : { new : true, select : "_id driverId"}
               
            })
    
            if(!cancelledTripSchedule) throw new AppError("An Error occurred. Please try again",  StatusCodes.INTERNAL_SERVER_ERROR)
    
            if(cancelledTripSchedule?.driverId?.toString() !== req.user && req.role in [ROLES.DRIVER, ROLES.RIDER] ) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN),StatusCodes.FORBIDDEN)
      
           const ridesInfo =  await RideRequestServiceLayer.aggregateRideRequests([ 
            { 
                $match : { tripScheduleId : data.tripScheduleId }
            }, 
          
            {
                $project : { 
                     riderId : 1 ,
                     _id : 1
                }
            }, 
            { 
                $lookup : { 
                    from : "users" ,
                    localField : "riderId", 
                    foreignField : "_id", 
                    pipeline : [
    {
        $project : { 
            deviceToken : 1 
        }
    }
                    ], 
                    as : "riderPushId"
                }
            }, 
                 {
                   $unwind: "$riderPushId"
               }, 
    
                  {
                   $lookup: {
                       from: "users",
                       localField: "driverId",
                       foreignField: "_id",
                       pipeline: [
                           {
                               $project: {
                                   firstName: 1,
                                   lastName : 1 , 
                                   _id : 1
    
                               }
                           }
                       ],
                       as: "driverData"
                   }, 
                }, { 
                      $unwind: "$driverData"
                }, 
               {
                   $lookup: {
                       from: "tripSchedules",
                       localField: "tripScheduleId",
                       foreignField: "_id",
                       pipeline: [
                           {
                               $project: {
                                   departureTime: 1
                               }
                           }
                       ],
                       as: "scheduleDepartureTime"
                   }
               },
               {
                   $unwind: "$scheduledDepartureTime"
               }, 
              
                {
                  $project : { 
                    ridersPushId : 1, 
                    driverData: 1 , 
                    scheduledDepartureTime : 1,
                    _id : 1
                    
                  }
                }
            
           ], session)
            
           if(!ridesInfo) throw new AppError("An error occurred.Please try again", StatusCodes.NOT_FOUND)
           
          
           return ridesInfo
        })
            return result
        }

      const ridesInfo = await retryTransaction(cancelSession, 1, data)

      if(!ridesInfo) throw new AppError("An error occurred.Please try again", StatusCodes.NOT_FOUND)
           

      if(ridesInfo.length === 0 ) {
    
        //The trip schedule has no ride request 
        return AppResponse(req, res, StatusCodes.OK, { 
            message : "Trip Schedule departure time updated successfully",

        })
    }


        const pushMessages = ridesInfo[0]?.map((riderData: { _id: string; riderPushId: string; driverData: { firstName: string; lastName: string; _id : string}; }) => ({
        name : `Trip_schedule_cancelled_${data.tripScheduleId}_${riderData._id}`, 
        data : {
            deviceToken: riderData.riderPushId,
            message: {
                body: `Your scheduled trip with ${riderData.driverData.firstName} ${riderData.driverData.lastName} on ${ridesInfo[0]?.scheduleDepartureTime.toLocaleDateString} has been cancelled due to unforeseen circumstances. We understand that this was not the outcome you anticipated, But don't worry, you can  book to ride with another driver at no extra cost`,
                screen: `rideRequest`,
                driverId : riderData.driverData._id,
                id: riderData._id
            }
        },
      opts :   { 
          removeonFail : true, 
          removeOnComplete : true,
          priority : 6
        }
         }))

       await batchPushQueue.addBulk(pushMessages)

       return AppResponse(req, res, StatusCodes.OK, {
       message : "Trip schedule departure time updated successfully", data : { _id : data.tripScheduleId } 
       })


    }

    async getTripSchedules(req: Request, res: Response) {
        const data: {
            scheduleId?: string;
            driverId?: string
            cursor?: string;
            town?: string;
            state?: string;
            country?: string;
            sort?: string;
            dateFrom ? : Date, 
            dateTo? : Date
        } = req.body;


        const matchQuery: MatchQuery = {};
   
        if (data?.dateFrom) {
            matchQuery.createdAt = { $gte: new Date(data.dateFrom), $lte: data?.dateTo ?? new Date(Date.now()) };
        }

        if (data?.scheduleId) {
            matchQuery._id = { $eq: data?.scheduleId };
        }

        if (data?.driverId) {
            matchQuery._id = { $eq: data?.driverId };
        }

        // if (data?.country) {
        //     matchQuery.origin.country = { $eq: data.country };
        // }

        // if (data?.state) {
        //     matchQuery.origin.state = { $eq: data.state };
        // }

        // if (data?.town) {
        //     matchQuery.origin.town = { $eq: data.town };
        // }

        const sortQuery: SortQuery = sortRequest(data?.sort);

        if (data?.cursor) {
            const orderValue = Object.values(sortQuery)[0] as unknown as number;

            const order =
                orderValue === 1 ? { $gt: data.cursor } : { $lt: data?.cursor };

            matchQuery._id = order;
        }

        const query = {
            query: matchQuery,
            aggregatePipeline: [{ $limit: 101 }, sortQuery],
            pagination: { pageSize: 100 },
        };

        const result = await this.TripSchedule.findTripSchedules(query);

        const hasData = result?.data?.length > 0;

        return AppResponse(
            req,
            res,
            hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            {
                message: hasData
                    ? `Stations retrieved succesfully`
                    : `No stations were found for this request `,
                data: result,
            }
        );
    }

    async getTripScheduleId(req: Request, res: Response) {

        const tripScheduleId: string = req.params.id

        const user = req.user

        const result = await this.TripSchedule.getTripScheduleById(tripScheduleId);

        if (result?.driverId !== user && req.role in [ROLES.DRIVER, ROLES.RIDER]) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)


        if (!result)
            throw new AppError(
                "No Schedules were  found for this request",
                StatusCodes.NOT_FOUND
            );

        return AppResponse(req, res, StatusCodes.OK, {
            message: "Schedules retrieved successfully",
            data: result,
        });
    }

    //Admins only
    async deleteTripSchedules(req: Request, res: Response) {
        const data: { tripScheduleIds: string[] } = req.body;

        const { tripScheduleIds } = data;

        if (tripScheduleIds.length === 0)
            throw new AppError(
                getReasonPhrase(StatusCodes.BAD_REQUEST),
                StatusCodes.BAD_REQUEST
            );

        const deletedTripSchedules = await this.TripSchedule.deleteTripSchedules(
            tripScheduleIds
        );

        return AppResponse(req, res, StatusCodes.OK, {
            message: `${deletedTripSchedules.deletedCount} bus stations deleted.`,
        });
    }

    async aggregateTripScheduleStats(req: Request, res: Response) {

        const data: {
            dateFrom?: Date,
            dateTo?: Date,
            status: Pick<ITripSchedule, "status">,
            country?: string,
            state?: string,
            town?: string,
        } = req.body

        const matchQuery: MatchQuery = {

        };

        if (data?.dateFrom) {
            matchQuery.createdAt = { $gte: new Date(data.dateFrom), $lte: data?.dateTo ?? new Date(Date.now()) };
        }

        // if (data?.country) {
        //     matchQuery.origin.country = { $eq: data.country };
        // }

        // if (data?.state) {
        //     matchQuery.origin.state = { $eq: data.state };
        // }

        // if (data?.town) {
        //     matchQuery.origin.town = { $eq: data.town };
        // }


        const query = [
            {
                $match: matchQuery
            },
            {
                $facet: {
                    count: [{ $count: "total" }],


                    topOriginTowns: [
                        {
                            $group: {
                                _id: "$origin.town",
                            },
                            top10: { $sort: { count: -1 }, $limit: 10 },
                            count: { $sum: 1 }
                        },
                    ],
                    topDestinationTown: [
                        {
                            $group: {
                                _id: "$destination.town",
                            },
                            top10: { $sort: { count: -1 }, $limit: 10 },
                            count: { $sum: 1 }
                        },
                    ],

                    topOriginStates: [
                        {
                            $group: {
                                _id: "$origin.state",
                            },
                            top10: { $sort: { count: -1 }, $limit: 10 },
                            count: { $sum: 1 }
                        },
                    ],
                    topDestinationStates: [
                        {
                            $group: {
                                _id: "$destination.state",
                            },
                            top10: { $sort: { count: -1 }, $limit: 10 },
                            count: { $sum: 1 }
                        },
                    ],

                    groupByMonthOfYear: [
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
                    status: [
                        {
                            $group: {
                                _id: "$status",
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    initialStatusRatio: [
                        {
                            $group: {
                                _id: "$initialStatus",
                                count: { $sum: 1 }
                            }
                        }
                    ]

                }

            }
        ]



        const result = await this.TripSchedule.aggregateTripSchedules(query)

        return AppResponse(req, res, StatusCodes.OK, result)

    }
}

export const TripSchedule = new TripScheduleController(tripScheduleServiceLayer);

export default TripSchedule;
