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

class TripScheduleController {
    private TripSchedule: TripScheduleService;

    constructor(service: TripScheduleService) {

        this.TripSchedule = service;
    }


    async createTripSchedule(req: Request, res: Response) {
        const data: ITripSchedule = req.body;


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
            tripSchedulesCount?.length > 0 && tripSchedulesCount[0].total <= 1;

        if (!canCreateNewRideScheduleToDestination)
            throw new AppError(
                `A maximum of 1 trip schedule can be created within an interval of 1 hour.`,
                StatusCodes.FORBIDDEN
            );

        const createdTripSchedule = await this.TripSchedule.createTripSchedule(data);

        return AppResponse(req, res, StatusCodes.CREATED, {
            message: "Trip schedule created successfully",
            data: createdTripSchedule,
        });
    }

    async getTripSchedules(req: Request, res: Response) {
        const data: {
            scheduleId: string;
            driverId: string
            cursor: string;
            town: string;
            state: string;
            country: string;
            sort: string;
        } = req.body;


        const matchQuery: MatchQuery = {};


        if (data?.scheduleId) {
            matchQuery._id = { $eq: data?.scheduleId };
        }

        if (data?.driverId) {
            matchQuery._id = { $eq: data?.driverId };
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

        const hasData = result?.data?.length === 0;

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

        const tripId: string = req.params.id

        const user = req.user

        const result = await this.TripSchedule.getTripScheduleById(tripId);

        if (result?.driverId !== user && req.role !== ROLES.ADMIN) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)


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

    async updateTripSchedule(req: Request, res: Response) {
        const data: ITripSchedule & { stationId: string, } = req.body;

        const { stationId, ...rest } = data;

        const updatedSchedule = await this.TripSchedule.updateTripSchedule({
            docToUpdate: stationId,
            updateData: {
                $set: {
                    ...rest,
                },
            },
            options: {
                new: true,
                select: "_id placeId",
            },
        });

        if (updatedSchedule?.driverId !== req.user && req.role !== ROLES.ADMIN) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)

        if (!updatedSchedule)
            throw new AppError(
                "Error : Update to SChedules failed",
                StatusCodes.NOT_FOUND
            );

        return AppResponse(req, res, StatusCodes.OK, {
            message: "SChedules updated successfully",
            data: updatedSchedule?._id
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

    async aggregateTripSheduleStats(req: Request, res: Response) {

        const data: {
            dateFrom: Date,
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

        if (data?.country) {
            matchQuery.country = { $eq: data?.country };
        }

        if (data?.state) {
            matchQuery.state = { $eq: data?.state };
        }

        if (data?.town) {
            matchQuery.town = { $eq: data?.town };
        }


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
                                _id: "$originTown",
                            },
                            top10: { $sort: { count: -1 }, $limit: 10 },
                            count: { $sum: 1 }
                        },
                    ],
                    topDestinationTown: [
                        {
                            $group: {
                                _id: "$destination",
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
