import { isNotAuthorizedToPerformAction } from './../utils/helpers/isAuthorizedForAction';
import { Request, Response } from "express";
import { IRideRequest } from "../model/interfaces";
import RideRequestService, {
  RideRequestServiceLayer,
} from "../services/rideRequestService";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppResponse from "../utils/helpers/AppResponse";
import AppError from "../middlewares/errors/BaseError";
import { MatchQuery } from "../../types/types";
import { sortRequest } from "../utils/helpers/sortQuery";
import { ClientSession } from "mongoose";
import { retryTransaction } from "../utils/helpers/retryTransaction";

import { UserServiceLayer } from "../services/userService";

import { emailQueue, pushQueue } from "../services/bullmq/queue";
import { COMPANY_MAIL_SENDER_ADDRESS } from '../config/constants/notification';

class RideRequestController {
  private rideRequest: RideRequestService;

  constructor(rideRequest: RideRequestService) {
    this.rideRequest = rideRequest;
  }

  //We are not creating a ride request for realtime rides, those will be done in realtime

  /**
   * Checkmate triple or an excessive number of bookings within the same timeframe  we can allow a maximum  of two rides to the same destination within an hour of each other , this goes for packages, selfride and thirdParty ride
   *
   * @param {Request} req - The request object
   * @param {Response} res - The response object
   * @return {AppResponse} Object containing message and created ride request data
   */
  async createRideScheduleRequest(req: Request, res: Response) {
    const data: IRideRequest = req.body;
    const user = req.user;



    //Check if the rider has up to two scheduled rides within the same timeframe , max of one hr apart and heading to the same destination with the same trip type

    const rideRequests = await this.rideRequest.aggregateRideRequests([
      {
        $match: {
          riderId: user,
          type: data.type,
          status: "scheduled",
          destination : data.destination
        },
      },

      {
        $lookup: {
          from: "Trips",
          localField: "tripId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                departureTime: 1,
              },
            },
          ],
          as: "$tripData",
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
            $lte: { $add: ["$tripData.departureTime", 60000] }, // Adding 60000 milliseconds (1 minute)
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
      rideRequests?.length > 0 && rideRequests[0].total < 2;

    if (!canCreateNewRideScheduleToDestination)
      throw new AppError(
        `A maximum of 2 rides of the same type can be scheduled to the same destination within an interval of 1 hour.`,
        StatusCodes.FORBIDDEN
      );

    const createdRideRequest = await this.rideRequest.createRideRequest({
      ...data,
      initialStatus: "scheduled"
    });

    return AppResponse(req, res, StatusCodes.CREATED, {
      message: "Ride request created successfully",
      data: createdRideRequest,
    });
  }

  async createLiveRideRequest(req: Request, res: Response) {

    const data: Omit<IRideRequest, "tripScheduleId"> = req.body

    const user = req.user;
   

    if ((data?.driverId?.toString() !== user || data?.riderId?.toString() !== user) && isNotAuthorizedToPerformAction(req)) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)


    const liveRideRequest = await this.rideRequest.createRideRequest({
      ...data,
      initialStatus: "live"
    })


    return AppResponse(req, res, StatusCodes.OK, {
      message: "Ne live ride request created",
      data: liveRideRequest
    })

  }

  /**
   * Retrieves ride schedule requests based on trip schedule.
   *
   * @param {Request} req - The request object
   * @param {Response} res - The response object
   * @return {AppResponse} Object containing message and retrieved ride schedules
   */
  async getRideRequestByTripSchedule(req: Request, res: Response) {

    const { tripScheduleId, cursor, driverId } = req.params;


   const matchQuery : MatchQuery  =  { } 
    
    matchQuery.tripScheduleId =  {  $eq : tripScheduleId}
    matchQuery.driverId = { $eq: driverId }
   

    const sortQuery = sortRequest();

    if (cursor) {
      const orderValue = Object.values(sortQuery)[0] as unknown as number;

      const order =
        orderValue === 1 ? { $gt: cursor } : { $lt:cursor };

      matchQuery._id = order;
    }

    const rideScheduleRequests = await this.rideRequest.findRideRequests({
      query: matchQuery,
      aggregatePipeline: [
        sortQuery,
        {
          $limit: 101,
        },

        {
          $lookup: {
            from: "busStations",
            localField: "destination",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  name: 1,
                },
              },
            ],
            as: "$pickupPoint",
          },
        },

        {
          $lookup: {
            from: "busStations",
            localField: "destination",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  name: 1,
                },
              },
            ],
            as: "$destinationPoint",
          },
        },

        { $unwind: "$$pickupPoint" },

        { $unwind: "$$destinationPoint" },

        {
          $project: {
            tripId: 1,
            riderId: 1,
            driverDecision: 1,
            type: 1,
            status: 1,
            packageInfo: 1,
            riderDecision: 1,
            pickupPoint: 1,
            destinationPoint: 1,
          },
        },
      ],
      pagination: {
        pageSize: 100,
      },
    });

    const hasData = rideScheduleRequests?.data?.length > 0;

    

    if (!hasData)
      throw new AppError(
        "No requests were found for this trip",
        StatusCodes.NOT_FOUND
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Ride requests retrieved successfuly",
      data: rideScheduleRequests,
    });
  }

  /**
   * Accepts a ride schedule request by creating a ride and closing the request.
   *
   * @param {Request} req - The request object
   * @param {Response} res - The response object
   * @return {AppResponse} Object containing message and ride id
   */
  async acceptRideScheduleRequestDriver(req: Request, res: Response) {
    // Create a ride and close the request

    const data: { rideRequestId: string; driverId: string } = req.body;

    /**
     * Accepts a ride schedule request by creating a ride and closing the request.
     *
     * @param {typeof data} args - The arguments for the function
     * @param {ClientSession} session - The session for the database transaction
     * @return {Promise<string>} The id of the created ride
     */
    const acceptRideSession = async (
      args: typeof data,
      session: ClientSession
    ): Promise<string> => {

      const response = await session.withTransaction(async () => {
        const { rideRequestId, driverId } = args;

        // Find the ride request and update its status and decision
        const acceptedRide = await this.rideRequest.updateRideRequest({
          docToUpdate: { driverId, _id: { rideRequestId, status: "created" } },
          updateData: {
            $set: {
              status: "closed",
              driverDecision: "accepted",
            },
          },
          options: { session, new: true , select : "driverId riderId driverBudget riderBudget"  },
        });

        if (!acceptedRide)
          throw new AppError(
            getReasonPhrase(StatusCodes.NOT_FOUND),
            StatusCodes.NOT_FOUND
          );

        

        const users = await UserServiceLayer.getUsers({
          query: {
            _id: { $in: [acceptedRide.driverId, acceptedRide.riderId] },
          },
          select: "deviceToken firstname _id email"
        })

        if (!users || users.length < 2) throw new AppError(`An Error occured.  Please try again later`, StatusCodes.BAD_REQUEST)

        const riderIndex = users.findIndex(user => user._id.toString() === req.user)

        const riderData = users[riderIndex]
        const driverData = users[1 - riderIndex]


        pushQueue.add(`RIDE_REQUEST_ACCEPTED_${acceptedRide._id}`, {
          deviceTokens: [riderData.deviceToken],
          message:
          {
            body: `Your budget of ${acceptedRide.driverBudget} to ${acceptedRide.destination.name} with ${driverData.firstName} has been accepted`,
            title: "Price Negotiated",
            screen: "rideRequest",
            id: `${acceptedRide._id}`
          }


        }, { priority: 7 })


        return acceptedRide
      });

      return response._id as string
    };

    const response = await retryTransaction(acceptRideSession, 1, data);

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Ride request to accepted successfully",
      response,
    });
  }

  async rejectRideScheduleRequestDriver(req: Request, res: Response) {
    const { rideRequestId, driverId } = req.body;

    const rejectedRide = await this.rideRequest.updateRideRequest({
      docToUpdate: { _id: rideRequestId, driverId, status: "created" },
      updateData: {
        $set: {
          driverDecision: "rejected",
          status: "closed",
        },
      },
      options: { select: "_id riderId driverId destination driverBudget riderBudget" },
    });

    if (!rejectedRide)
      throw new AppError(
        getReasonPhrase(StatusCodes.NOT_FOUND),
        StatusCodes.NOT_FOUND
      );


    const users = await UserServiceLayer.getUsers({
      query: {
        _id: { $in: [rejectedRide.driverId, rejectedRide.riderId] },
      },
      select: "deviceToken firstname _id email"
    })

    if (!users || users.length < 2) throw new AppError(`An Error occured.  Please try again later`, StatusCodes.BAD_REQUEST)

    const riderIndex = users.findIndex(user => user._id.toString() === req.user)

    const riderData = users[riderIndex]
    const driverData = users[1 - riderIndex]


    pushQueue.add(`RIDE_REQUEST_REJECTED`, {
      deviceTokens: [riderData.deviceToken],
      message:
      {
        body: `Your requst to ride with  with ${driverData.firstName}  to ${rejectedRide.destination.name} has been rejected  `,
        title: "Price Negotiated",
        screen: "rideRequest",
        id: `${rejectedRide._id}`
      }


    }, { priority: 10 })


    return AppResponse(req, res, StatusCodes.OK, {
      message: "Ride schedule rejected successfully",
      data: { rideId: rejectedRide._id },
    });
  }

  async negotiateRideScheduleRequestPriceDriver(req: Request, res: Response) {
    const data: {
      rideRequestId: string;
      driverId: string;
      driverBudget: string;
    } = req.body;

    const negotiatedRide = await this.rideRequest.updateRideRequest({
      docToUpdate: {
        _id:  { $eq :  data.rideRequestId },
        status: "created",
        driverId: {$eq : data.driverId},
      },
      updateData: {
        $set: {
          driverDecision: "negotiated",
          driverBudget: data.driverBudget,
        },
      },
      options: { new: true, select: "_id destination riderBudget driverId riderId driverBudget" },
    });

    if (!negotiatedRide)
      throw new AppError(
        getReasonPhrase(StatusCodes.NOT_FOUND),
        StatusCodes.NOT_FOUND
      );



    const users = await UserServiceLayer.getUsers({
      query: {
        _id: { $in: [negotiatedRide.driverId, negotiatedRide.riderId] },
      },
      select: "deviceToken firstname _id"
    })

    if (!users || users.length < 2) throw new AppError(`An Error occured.  Please try again later`, StatusCodes.BAD_REQUEST)

    const riderIndex = users.findIndex(user => user._id.toString() === req.user)

    const riderData = users[riderIndex]
    // const driverData = users[1 - riderIndex]


    pushQueue.add(`RIDE_REQUEST_BUDGET_NEGOTIATED`, {
      deviceTokens: [riderData.deviceToken],
      message:
      {
        body: `Your budget of ${negotiatedRide.riderBudget} to ${negotiatedRide.destination.name} with ${riderData.firstName} has been negotiated to ${negotiatedRide.driverBudget}`,
        title: "Price Negotiated",
        screen: "rideRequest",
        id: `${negotiatedRide._id}`
      }


    }, { priority: 10 })

  
    return AppResponse(req, res, StatusCodes.OK, {
      message: "Ride price negotiated successfully",
      data: { requestId: negotiatedRide._id },
    });
  }

  async acceptNegotiatedSchedulePriceRider(req: Request, res: Response) {
    const data: { riderId: string; rideRequestId: string } = req.body;

    const acceptNegotiatedPriceSession = async (
      args: typeof data,
      session: ClientSession
    ) => {
      const { riderId, rideRequestId } = args;

      const result = await session.withTransaction(async () => {
        const rideRequest = await this.rideRequest.updateRideRequest({
          docToUpdate: {
            _id: rideRequestId,
            riderId,
            status: "created",
            driverDecision: "negotiated",
          },
          updateData: {
            $set: {
              riderDecision: "accepted",
              status: "closed",
            },
          },
          options: { session, new: true,  select : "driverId riderId _id" },
        });

        if (!rideRequest)
          throw new AppError(
            getReasonPhrase(StatusCodes.NOT_FOUND),
            StatusCodes.NOT_FOUND
          );

        
        const users = await UserServiceLayer.getUsers({
          query: {
            _id: { $in: [rideRequest.driverId, rideRequest.riderId] },
          },
          select: "deviceToken firstname _id"
        })

        if (!users || users.length < 2) throw new AppError(`An Error occured.  Please try again later`, StatusCodes.BAD_REQUEST)

        const riderIndex = users.findIndex(user => user._id.toString() === req.user)

        const riderData = users[riderIndex]
        const driverData = users[1 - riderIndex]


        pushQueue.add(`DRIVER_BUDGET_REJECTED`, {
          deviceTokens: [driverData.deviceToken],
          message: 
          {
            body: `Your budget of ${rideRequest.driverBudget} to ${rideRequest.destination.name} for ${riderData.firstName} has been accepted`,
            title : "Price Accepted", 
            screen : "rideRequest",
            id : `${rideRequest._id}`
          }
        
      
        }, { priority: 10 })

      });

      return result;
    };

    const response = await retryTransaction(
      acceptNegotiatedPriceSession,
      1,
      data
    );

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Ride accepted successfully",
      response,
    });
  }

  async rejectNegotiatedScheduleRequestPriceRider(req: Request, res: Response) {
    const { rideRequestId, riderId } = req.body;



    const rejectedRide = await this.rideRequest.updateRideRequest({
      docToUpdate: {
        _id: rideRequestId,
        riderId,
        driverDecision: "negotiated",
        status: "created",
      },
      updateData: {
        $set: {
          riderDecision: "rejected",
          status: "closed",
        },
      },
      options: { new: true, select: "driverId riderId _id driverBudget destination" },
    });
  
   
    if (!rejectedRide )
      throw new AppError(
        getReasonPhrase(StatusCodes.NOT_FOUND),
        StatusCodes.NOT_FOUND
      );

    const users = await UserServiceLayer.getUsers({ 
      query : { 
        _id : { $in : [ rejectedRide.driverId,  rejectedRide.riderId]}, 
      }, 
      select : "deviceToken firstname _id"
    })


    if(!users || users.length < 2) throw new AppError(`An Error occured.  Please try again later`, StatusCodes.BAD_REQUEST)
    
    const riderIndex =  users.findIndex(user => user._id.toString() === req.user)  

    const riderData  =  users[riderIndex]
    const driverData =  users[1-riderIndex]

    
    pushQueue.add(`DRIVER_BUDGET_REJECTED`, { 
        deviceTokens : [driverData.deviceToken], 
        message : {
        body: `Your budget of ${rejectedRide.driverBudget} to ${rejectedRide.destination.name} for ${riderData.firstName} has been rejected`,
        title: "Price Accepted",
        screen: "rideRequest",
        id: `${rejectedRide._id}`
      }
      }

    , { priority : 10})

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Ride cancelled successfully",
      data: { _id: rejectedRide._id },
    });
  }

  async cancelRideRequest(req: Request, res: Response) {

    //Only a rider and admin can cancel a ride request 
    const data: { riderId : string,  rideRequestId: string } = req.body;


    const rideData = await this.rideRequest.getRideRequestById(data.rideRequestId)

    if(!rideData) throw new AppError(getReasonPhrase(StatusCodes.NOT_FOUND), StatusCodes.NOT_FOUND)

    const imposter  = isNotAuthorizedToPerformAction(req)

    const canCancelRide =  rideData?.riderId?.toString() === req.user || !imposter 

    if (!canCancelRide) throw new AppError("You are not authorized to cancel this ride", StatusCodes.FORBIDDEN)


    const cancelledRideRequest = await this.rideRequest.updateRideRequest({
      docToUpdate: {
        _id: data.rideRequestId,
       
      },
      updateData: {
        $set: {
          status: "cancelled",
        },
      },
      options: { new: true, select: "_id driverId driverEmail " },
    });


    if (!cancelledRideRequest)
      throw new AppError(
        getReasonPhrase(StatusCodes.NOT_FOUND),
        StatusCodes.NOT_FOUND
      );

    //TODO : Send email TO DRIVER - CANCELLED RIDE REQUEST

    if (cancelledRideRequest?.driverId) {
      emailQueue.add(`RIDE_CANCELLED_${cancelledRideRequest._id}`, {
        to: cancelledRideRequest.driverEmail!,
        from : `${COMPANY_MAIL_SENDER_ADDRESS}`,
        template: ``,
        subject: "Ride request cancellation "
      }, { priority: 7 })
    }

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Ride cancelled successfully",
      data: { _id: cancelledRideRequest._id },
    });
  }
  //@admin only
  async getRideRequests(req: Request, res: Response) {
    const data: {
      cursor?: string;
      status?: string;
      rideRequestId? : string
      tripScheduleId?: string;
      driverId?: string;
      sort?: string;
      type?: "solo" | "share"
      forThirdParty? : boolean
    } = req.body;

    const matchQuery: MatchQuery = {};

    if (data?.status) {
      matchQuery.status = { status: { $eq: data.status } };
    }

    if (data?.tripScheduleId) {
      matchQuery.tripId = { status: { $eq: data.tripScheduleId } };
    }

    if(data?.rideRequestId){
      matchQuery._d = { status: { $eq: data.rideRequestId } };
    }

    if (data?.forThirdParty) {
      matchQuery.friendData = { $exists: true }
    }

    if (data?.type) {
      matchQuery.type = { status: { $eq: data.type } };
    }
    if (data?.driverId) {
      matchQuery.driverId = { status: { $eq: data.driverId } };

    }

    const sortQuery = sortRequest(data.sort);

    if (data?.cursor) {
      const orderValue = Object.values(sortQuery)[0] as unknown as number;

      const order =
        orderValue === 1 ? { $gt: data.cursor } : { $lt: data?.cursor };

      matchQuery._id = order;
    }

    const rideScheduleRequests = await this.rideRequest.findRideRequests({
      query: matchQuery,
      aggregatePipeline: [
        sortQuery,
        {
          $limit: 101,
        },

        {
          $lookup: {
            from: "busStations",
            localField: "destination",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  name: 1,
                },
              },
            ],
            as: "$pickupPoint",
          },
        },

        {
          $lookup: {
            from: "busStations",
            localField: "destination",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  name: 1,
                },
              },
            ],
            as: "$destinationPoint",
          },
        },

        { $unwind: "$$pickupPoint" },

        { $unwind: "$$destinationPoint" },

        {
          $project: {
            tripId: 1,
            riderId: 1,
            driverDecision: 1,
            type: 1,
            status: 1,
            packageInfo: 1,
            riderDecision: 1,
            pickupPoint: 1,
            destinationPoint: 1,
          },
        },
      ],
      pagination: {
        pageSize: 100,
      },
    });

    const hasData = rideScheduleRequests?.data?.length === 0;

    

    if (!hasData)
      throw new AppError(
        "No  matching ride request were found",
        StatusCodes.NOT_FOUND
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Ride requests retrieved successfuly",
      data: rideScheduleRequests,
    });
  }
  async deleteRideRequests(req: Request, res: Response) {
    const data: { rideRequestIds: string[] } = req.body;

    const { rideRequestIds } = data;

    if (rideRequestIds.length === 0)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const deletedRideRequests = await this.rideRequest.deleteRideRequests(
      rideRequestIds
    );

    return AppResponse(req, res, StatusCodes.OK, {
      message: `${deletedRideRequests.deletedCount} ride requests deleted.`,
    });
  }

  async getRideRequestStats(req: Request, res: Response) {

    const data: {
      dateFrom?: Date,
      dateTo?: Date,
      status: Pick<IRideRequest, "status">,
      type?: "package" | "selfride" | "thirdParty",
      country?: string,
      state?: string,
      town?: string,
      riderId?: string
      driverId?: string
    } = req.body

    const matchQuery: MatchQuery = {
     
    }; 

    if(data.dateFrom){
      matchQuery.createdAt =  { $gte: new Date(data.dateFrom), $lte: data?.dateTo ?? new Date(Date.now()) }
    }

    if (data?.country) {
      matchQuery.country = { $eq: data.country };
    }

    if (data?.state) {
      matchQuery.state = { $eq: data.state };
    }

    if (data?.town) {
      matchQuery.town = { $eq: data.town };
    }

    if (data?.driverId) {
      matchQuery.driverId = { $eq: data.driverId };
    }


    if (data?.riderId) {
      matchQuery.riderId = { $eq: data.riderId };
    }


    const query =
      [
        {
          $match: matchQuery
        },
        {
          $facet: {
            count: { $count: "total" },

            averageRideRequestDistance: [
              {
                $avg: "$totalRideDistance"
              }
            ],

            topPickupPoint: [
              {
                $group: {
                  _id: "$pickupPoint",
                  count: { $sum: 1 }
                }
              },
              {
                $sort: { count: -1 }
              },
              {
                $limit: 10
              },
              {
                $lookup: {
                  from: "BusStation",
                  localField: "_id", // localField should be _id because _id contains pickupPoint after grouping
                  foreignField: "_id",
                  as: "busStation"
                }
              },
              {
                $unwind: "$busStation"
              },
              {
                $project: {
                  "busStation.name": 1,
                  count: 1
                }
              }
            ],
            topDestination: [
              {
                $group: {
                  _id: "$destination",
                  count: { $sum: 1 }
                }
              },
              {
                $sort: { count: -1 }
              },
              {
                $limit: 20
              },
              {
                $lookup: {
                  from: "BusStation",
                  localField: "_id", // localField should be _id because _id contains pickupPoint after grouping
                  foreignField: "_id",
                  as: "busStation"
                }
              },
              {
                $unwind: "$busStation"
              },
              {
                $project: {
                  "busStation.name": 1,
                  count: 1
                }
              }
            ],


            groupTypeByMonthOfYear: [
              {
                $group: {
                  _id: {
                    month: { $month: "$createdAt" },
                    status: "$type"
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

            groupStatusByMonthOfYear: [
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

            groupInitialStatusByMonthOfYear: [
              {
                $group: {
                  _id: {
                    month: { $month: "$createdAt" },
                    status: "$type"
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
            cancellationReasonBreakdown: [
              {
                $group: {
                  _id: "$cancellationData.reason"
                },
                count: { $sum: 1 }
              }
            ],



          }

        }
      ]


    //@ts-expect-error //ts doesnt recognize the stage correctly
    const result = await this.rideRequest.aggregateRideRequests(query)

    return AppResponse(req, res, StatusCodes.OK, result)

  }
}

export const RideRequest = new RideRequestController(RideRequestServiceLayer);

export default RideRequest;
