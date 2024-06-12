
import { retryTransaction } from './../utils/helpers/retryTransaction';
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import TripService, {
    TripsServiceLayer,
} from "../services/tripService";
import { Request, Response } from "express";
import { ITrip } from "../model/interfaces";
import AppResponse from "../utils/helpers/AppResponse";
import { MatchQuery, SortQuery } from "../../types/types";
import { sortRequest } from "../utils/helpers/sortQuery";
import { ROLES } from "../config/enums";
import { ClientSession } from "mongoose";
import { TownServiceLayer } from "../services/townService";
import Country from "../model/country";
import State from "../model/state";
import { DocumentsServiceLayer } from "../services/documentsService";
import { COMPANY_NAME } from '../config/constants/base';
import { UserServiceLayer } from '../services/userService';

class TripController {
    private Trip: TripService;

    constructor(service: TripService) {
        this.Trip = service;
    }

    async createTrip(req: Request, res: Response) {
        const data: ITrip = req.body;

        const createdTrip = await this.Trip.createTrip(data);

        return AppResponse(req, res, StatusCodes.CREATED, {
            message: "Bus station created successfully",
            data: createdTrip,
        });
    }

    async getTrips(req: Request, res: Response) {
        const data: {
            stationId: string;
            cursor: string;
            town: string;
            state: string;
            country: string;
            sort: string;

        } = req.body;

        const matchQuery: MatchQuery = {};

        if (data?.stationId) {
            matchQuery._id = { $eq: data?.stationId };
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

        const result = await this.Trip.findTrips(query);
        const driver = result?.data && result.data[0]?.driverId

        if (driver !== req.user && req.role !== ROLES.ADMIN) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)


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

    async canStartTrip(req: Request, res: Response) {
        const town = req.params.id
        const user = req.user as string


        const response = await retryTransaction(this._canStartTripSession, 1, { town, user })

        if (!response) throw new AppError(`Please complete your verification in order to start a trip. Help us keep ${COMPANY_NAME} safe for you and other users`, StatusCodes.FORBIDDEN)


        return AppResponse(req, res, StatusCodes.OK, { message: "Driver is verified and can begin trip" })

    }

    async _canStartTripSession(args: { user: string, town: string }, session: ClientSession) {

        const canStartTrip: boolean = await session.withTransaction(async () => {


            //Remember , the document names must match the names in the required Docs field
            const documents = await TownServiceLayer.getTownById(
                args.town,
                "_id requiredDocs",
                session,
                [
                    {
                        path: "Country",
                        select: "requiredDocs",
                        model: Country
                    },

                    {
                        path: "State",
                        select: "requiredDocs",
                        model: State
                    }
                ]
            )
            if (!documents) throw new AppError("Something went wrong. PLease try again", StatusCodes.NOT_FOUND)

            //@ts-expect-error This will always populate 
            const documentNames = [...documents.requiredDocs, ...documents.country.requiredDocs, ...documents.state.requiredDocs]

            const documentsAvailable = await DocumentsServiceLayer.getDocumentsWithPopulate({
                query: {
                    driverId: args.user,
                    status: "assessed",
                    isVerified: true,
                    archived: false
                },
                select: "name"

            })

            const userPaymentMethod = await UserServiceLayer.getUserById(args.user, "paymentMethod")


            const hasValidPaymentMethod = userPaymentMethod?.paymentMethod

            let isVerified: boolean = true

            if (!hasValidPaymentMethod) {
                isVerified = false
                return isVerified
            }



            const names = documentsAvailable.reduce((acc: string[], obj) => {
                acc.push(obj.name);
                return acc;
            }, []);



            for (const documentName of names) {

                if (!(documentName in documentNames)) {
                    isVerified = false
                }
            }

            return isVerified
        })

        return canStartTrip

    }

    async getBuStationById(req: Request, res: Response) {
        const stationId: string = req.params.id;

        const result = await this.Trip.getTripById(stationId);

        if (!result)
            throw new AppError(
                "No station was found for this request",
                StatusCodes.NOT_FOUND
            );

        return AppResponse(req, res, StatusCodes.OK, {
            message: "Bus station retrieved successfully",
            data: result,
        });
    }

    async updateTrip(req: Request, res: Response) {
        const data: ITrip & { stationId: string } = req.body;

        const { stationId, ...rest } = data;

        const updatedStation = await this.Trip.updateTrip({
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


        if (!updatedStation)
            throw new AppError(
                "Error : Update to bus station failed",
                StatusCodes.NOT_FOUND
            );

        return AppResponse(req, res, StatusCodes.OK, {
            message: "Bus station updated successfully",
            data: updatedStation,
        });
    }

    //Admins only
    async deleteTrips(req: Request, res: Response) {
        const data: { TripIds: string[] } = req.body;

        const { TripIds } = data;

        if (TripIds.length === 0)
            throw new AppError(
                getReasonPhrase(StatusCodes.BAD_REQUEST),
                StatusCodes.BAD_REQUEST
            );

        const deletedTrips = await this.Trip.deleteTrips(
            TripIds
        );

        return AppResponse(req, res, StatusCodes.OK, {
            message: `${deletedTrips.deletedCount} trips deleted.`,
        });
    }

    async getTripStats(req: Request, res: Response) {

        const data: {
            dateFrom: Date,
            dateTo?: Date,
            status: Pick<ITrip, "status">,
            country?: string,
            state?: string,
            town?: string,
            driverId?: string
        } = req.body

        const matchQuery: MatchQuery = {

        };

        if (data?.dateFrom) {
            matchQuery.createdAt = { $gte: new Date(data.dateFrom), $lte: data?.dateTo ?? new Date(Date.now()) };
        }

        if (data?.driverId) {
            matchQuery.driverId = { $eq: data?.driverId };
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


        const query = {

            pipeline: [
                {
                    $match: matchQuery
                },
                {
                    $facet: {
                        count: [{ $count: "total" }],

                        tripMins: [
                            {
                                $project: {
                                    tripMins: {
                                        $subtract: [
                                            "$endTime",
                                            "$departureTime"
                                        ]
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    avgTripMins: { $avg: "$tripMins" }
                                }
                            }
                        ],
                        tripDataAverage: [
                            {
                                $project: {
                                    distancePerTrip: {
                                        $divide: [
                                            "$distance",
                                            {
                                                $subtract: [
                                                    "$endTime",
                                                    "$departureTime"
                                                ]
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    avgKmPerHour: { $avg: "$distancePerTrip" }
                                }
                            }
                        ],
                        sixhrIntervalDataForTripGroup: [
                            {
                                $project: {
                                    interval: {
                                        $switch: {
                                            branches: [
                                                {
                                                    case: {
                                                        $lte: [
                                                            {
                                                                $mod: [
                                                                    {
                                                                        $hour: "$createdAt"
                                                                    },
                                                                    6
                                                                ]
                                                            },
                                                            0
                                                        ]
                                                    },
                                                    then: "00:00 - 06:00"
                                                },
                                                {
                                                    case: {
                                                        $lte: [
                                                            {
                                                                $mod: [
                                                                    {
                                                                        $hour: "$createdAt"
                                                                    },
                                                                    6
                                                                ]
                                                            },
                                                            6
                                                        ]
                                                    },
                                                    then: "06:00 - 12:00"
                                                },
                                                {
                                                    case: {
                                                        $lte: [
                                                            {
                                                                $mod: [
                                                                    {
                                                                        $hour: "$createdAt"
                                                                    },
                                                                    6
                                                                ]
                                                            },
                                                            12
                                                        ]
                                                    },
                                                    then: "12:00 - 18:00"
                                                },
                                                {
                                                    case: {
                                                        $lte: [
                                                            {
                                                                $mod: [
                                                                    {
                                                                        $hour: "$createdAt"
                                                                    },
                                                                    6
                                                                ]
                                                            },
                                                            18
                                                        ]
                                                    },
                                                    then: "18:00 - 00:00"
                                                }
                                            ],
                                            default: "Error"
                                        }
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: "$interval",
                                    count: { $sum: 1 }
                                }
                            }
                        ],

                        // groupByMonthOfYear: [
                        //     {
                        //         $group: {
                        //             _id: {
                        //                 month: { $month: "$createdAt" }
                        //             },
                        //             count: { $sum: 1 }
                        //         }
                        //     }
                        // ], 

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
            ],

        };

        const result = await this.Trip.aggregateTrips(query)

        return AppResponse(req, res, StatusCodes.OK, result)
        //Trip count, trip count by status,trip ratio 
    }





}

export const Trip = new TripController(TripsServiceLayer);

export default Trip;
