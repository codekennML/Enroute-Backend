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
import { ROLES } from "../config/enums";
import { UserServiceLayer } from "../services/userService";
import { CommunicationServiceLayer } from "../services/communicationService";
import { pushQueue } from "../services/bullmq/queue";

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
    const role = req.role

    if ((data?.driverId !== user || data?.riderId !== user) && role !== ROLES.ADMIN) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)


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
  async getRideScheduleRequestByTripSchedule(req: Request, res: Response) {

    const { tripScheduleId, cursor, driverId } = req.params;

    const result = await this.#getRideScheduleRequests({
      tripScheduleId,
      cursor,
      driverId,
    });

    if (!result?.hasData)
      throw new AppError(
        "No more requests for for this trip",
        StatusCodes.NOT_FOUND
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Ride requests retrieved successfuly",
      data: result.rideSchedules,
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
        const rideRequest = await this.rideRequest.updateRideRequest({
          docToUpdate: { driverId, _id: { rideRequestId, status: "created" } },
          updateData: {
            $set: {
              status: "closed",
              driverDecision: "accepted",
            },
          },
          options: { session, new: true },
        });

        if (!rideRequest)
          throw new AppError(
            getReasonPhrase(StatusCodes.NOT_FOUND),
            StatusCodes.NOT_FOUND
          );

        return rideRequest
      });

      return response._id
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
      options: { select: "_id" },
    });

    if (!rejectedRide)
      throw new AppError(
        getReasonPhrase(StatusCodes.NOT_FOUND),
        StatusCodes.NOT_FOUND
      );

    //TODO : Send Ride rejected email
    //Both rider and

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Ride schedule rejected successfully",
      data: { rideId: rejectedRide._id },
    });
  }

  async negotiateRideSchedulePriceDriver(req: Request, res: Response) {
    const data: {
      rideRequestId: string;
      driverId: number;
      driverBudget: string;
    } = req.body;

    const negotiatedRide = await this.rideRequest.updateRideRequest({
      docToUpdate: {
        _id: data.rideRequestId,
        status: "created",
        driverId: data.driverId,
      },
      updateData: {
        $set: {
          driverDecision: "negotiated",
          driverBudget: data.driverBudget,
        },
      },
      options: { new: true, select: "_id" },
    });

    if (!negotiatedRide)
      throw new AppError(
        getReasonPhrase(StatusCodes.NOT_FOUND),
        StatusCodes.NOT_FOUND
      );

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
          options: { session, new: true },
        });

        if (!rideRequest)
          throw new AppError(
            getReasonPhrase(StatusCodes.NOT_FOUND),
            StatusCodes.NOT_FOUND
          );

        //SEND EMAIL TOO



        //TODO : Send negotiated price accepted email
        // const email = rideRequest.driverEmail;

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

  async rejectNegotiatedSchedulePriceRider(req: Request, res: Response) {
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
      select : "deviceToken firstname"
    })


    if(!driverData || !driverData.length < 2) throw new AppError(`An Error occured.  Please try again later`, StatusCodes.BAD_REQUEST)
    
    const riderData =  driverData.map()

    //TODO : Send PUSH TO DRIVER - REJECTED NEGOTIATION
    
  
    pushQueue.add(`DRIVER_BUDGET_REJECTED`, { 
       deviceTokens : [driverData.deviceToken], 
        message  : `Your `
    }, { priority : 10})

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Ride cancelled successfully",
      data: { _id: rejectedRide._id },
    });
  }

  async cancelRideRequest(req: Request, res: Response) {
    const data: { riderId: string; rideRequestId: string } = req.body;


    const rideData = await this.rideRequest.getRideRequestById(data.rideRequestId)


    const canCancelRide = rideData?.driverId.toString() === data.riderId || rideData?.riderId?.toString() === data.riderId || data.userRole !== ROLES.ADMIN

    if (!canCancelRide) throw new AppError("You are not authorized to cancel this ride", StatusCodes.FORBIDDEN)


    const cancelledRideRequest = await this.rideRequest.updateRideRequest({
      docToUpdate: {
        _id: data.rideRequestId,
        riderId: data.riderId,
        status: "created",
      },
      updateData: {
        $set: {
          status: "cancelled",
        },
      },
      options: { new: true, select: "_id" },
    });



    if (!cancelledRideRequest)
      throw new AppError(
        getReasonPhrase(StatusCodes.NOT_FOUND),
        StatusCodes.NOT_FOUND
      );

    //TODO : Send EMAIL TO DRIVER - CANCELLED NEGOTIATION

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
      tripScheduleId?: string;
      driverId?: string;
      sort?: string;
      type?: "package" | "selfride" | "thirdParty";
    } = req.body;

    const results = await this.#getRideScheduleRequests(data);

    if (!results?.hasData)
      throw new AppError(
        "No more requests for for this trip",
        StatusCodes.NOT_FOUND
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Ride requests retrieved successfuly",
      data: results.rideSchedules,
    });
  }

  async #getRideScheduleRequests(data: {
    cursor?: string;
    status?: string;
    tripScheduleId?: string;
    driverId?: string;
    sort?: string;
    type?: "package" | "selfride" | "thirdParty";
  }) {
    const matchQuery: MatchQuery = {};

    if (data?.status) {
      matchQuery.status = { status: { $eq: data.status } };
    }

    if (data?.tripScheduleId) {
      matchQuery.tripId = { status: { $eq: data.tripScheduleId } };
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

    const rideSchedules = await this.rideRequest.findRideRequests({
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

    const hasData = rideSchedules?.data?.length === 0;

    return {
      hasData,
      rideSchedules,
    };
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
      dateFrom: Date,
      dateTo: Date,
      status: Pick<IRideRequest, "status">,
      type?: "package" | "selfride" | "thirdParty",
      country?: string,
      state?: string,
      town?: string,
      riderId?: string
      driverId?: string
    } = req.body

    const matchQuery: MatchQuery = {
      createdAt: { $gte: new Date(data.dateFrom), $lte: data?.dateTo ?? new Date(Date.now()) }
    };

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
