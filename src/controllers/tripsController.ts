// import { tripScheduleServiceLayer } from './../services/tripScheduleService';

import { retryTransaction } from './../utils/helpers/retryTransaction';
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import tripsService, {
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
import { VehicleServiceLayer } from '../services/vehicleService';
import { RideServiceLayer } from '../services/rideService';
import { isNotAuthorizedToPerformAction } from '../utils/helpers/isAuthorizedForAction';

class TripsController {
    private trips: tripsService;

    constructor(service: tripsService) {
        this.trips = service;
    }

    async createTrips(req: Request, res: Response) {
        const data: ITrip = req.body;

        const createdtrips = await this.trips.createTrip(data);

        return AppResponse(req, res, StatusCodes.CREATED, {
            message: "Bus station created successfully",
            data: createdtrips,
        });
    }

    async getTrips(req: Request, res: Response) {
        const data: {
            tripId?: string;
            cursor?: string;
            town?: string;
            state?: string;
            country?: string;
            sort?: string;
            driverId? : string;
            dateFrom?: Date;
            dateTo?: Date;

        } = req.body;

        const matchQuery: MatchQuery = {};

        if (data?.tripId) {
            matchQuery._id = { $eq: data?.tripId };
        }

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

        const result = await this.trips.findTrips (query);
        
        const driver = result?.data && result.data[0]?.driverId

        const isImpostor =  isNotAuthorizedToPerformAction(req)

        if (driver !== req.user && isImpostor ) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)


        const hasData = result?.data?.length === 0;

        return AppResponse(
            req,
            res,
            hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            {
                message: hasData
                    ? `Trips retrieved succesfully`
                    : `No trips were found for this request `,
                data: result,
            }
        );
    }

    async canStartTrip(req: Request, res: Response) {
        const town = req.params.id
        const user = req.user as string


        const response = await retryTransaction(this._canStartTripsSession, 1, { town, user })

        if (!response) throw new AppError(`Please complete your verification in order to start a trip. Help us keep ${COMPANY_NAME} safe for you and other users`, StatusCodes.FORBIDDEN)


        return AppResponse(req, res, StatusCodes.OK, { message: "Driver is verified and can begin trip" })

    }

    async _canStartTripsSession(args: { user: string, town: string }, session: ClientSession) {

        const canStarttrips: boolean = await session.withTransaction(async () => {


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
            if (!documents) throw new AppError("Something went wrong. Please try again", StatusCodes.NOT_FOUND)

                const documentNames = [
                ...documents.requiredDriverDocs, 
                //@ts-expect-error THis will be populated
                ...documents.country.requiredDriverDocs ,
                    //@ts-expect-error THis will be populated
                ...documents.state.requiredDriverDocs
                ]
             
            const documentNamesArray =  documentNames.map(document => document.name)


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
        
            if(!userPaymentMethod) throw new AppError(`An Error occurred`,  StatusCodes.NOT_FOUND)

            const hasValidPaymentMethod = userPaymentMethod?.paymentMethod


            const vehicleVerified =  await VehicleServiceLayer.
           findVehicles({ 
                query : { 
                    status : { $eq : "accessed"}, 
                    isArchived : { $eq : false }, 
                    isVerified : {$eq : true}, 
                    $or : [ 

                        { "insurance.expiryDate" : { $lte : new Date} } , 
                        { "inspection.expiryDate": { $lte: new Date } },  
                    ]

                }, 
             
                select : "_id"
            })

            if (!vehicleVerified ) throw new AppError(`An Error occurred`, StatusCodes.NOT_FOUND)
 
            let isVerified: boolean = true

            if (!hasValidPaymentMethod) {
                isVerified = false
                return isVerified
            } 

            if(vehicleVerified?.length < 1 ) { 
                isVerified = false
                return isVerified
            }

            const names = documentsAvailable.reduce((acc: string[], obj) => {
                acc.push(obj.name);
                return acc;
            }, []);


            for (const documentName of names) {

                if (!(documentName in documentNamesArray)) {
                    isVerified = false
                }
            }

            return isVerified
        })

        return canStarttrips

    }

    async getTripById(req: Request, res: Response) {

        const tripId : string = req.params.id;

        const result = await this.trips.getTripsById(tripId);

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
        const data: Pick<ITrip, "origin" | "destination" | "departureTime" | "status" > & { tripId: string } = req.body;

        const { tripId, ...rest } = data;

        const docToFind : Record<string , object| string | number > = { tripId : { $eq: tripId }}
     
        if(req.role === ROLES.DRIVER ){ 
            docToFind.driverId = { $eq : req.user }
        }

        const updatedTrip= await this.trips.updateTrip({
            docToUpdate: docToFind,
            updateData: {
                $set: {
                    ...rest,
                },
            },
            options: {
                new: true,
                select: "_id placeId",
            }
        });


        if (!updatedTrip)
            throw new AppError(
                "Error : Update to trip failed",
                StatusCodes.NOT_FOUND
            )

        return AppResponse(req, res, StatusCodes.OK, {
            message: "Trip updated successfully",
            data: updatedTrip,
        });
    }


    async endTrip(req : Request, res : Response) { 

        const { tripId,  driverId} =  req.body 

        //Check if there are any ongoing rides, with this tripId
      
        const ongoingRides =  await RideServiceLayer.
        findRides({ 
            query : { 
                $match : { 
                tripId : { $eq : tripId }, 
                dropOffTime : { $exists : true}
            } },
            aggregatePipeline : [],
            pagination : { 
                pageSize : 2
            }
        })

        if(!ongoingRides  || !ongoingRides?.data) throw new AppError("No trip matching this request, Please try again", StatusCodes.NOT_FOUND) 

         if  ( ongoingRides?.data?.length > 0 ) {
            throw new AppError(`You have to drop off all your riders`, StatusCodes.FORBIDDEN)
         }

        const updatedTrip =  await this.trips.updateTrip({ 
            docToUpdate : { tripId : { $eq : tripId }, 
        driverId : { $eq : driverId}},
        updateData : { 
            $set : { 
                endTime : new Date(),
                status : "completed"
            }
        },
        options : { new : true , select : "_id"}
        }) 

        return AppResponse(req, res, StatusCodes.OK, { 
            message : "Trip ended successfully",
            data : { _id : updatedTrip?._id}
        })

    }

    //Admins only
    async deleteTrips(req: Request, res: Response) {
        const data: { tripIds: string[] } = req.body;

        const { tripIds } = data;

        if (tripIds.length === 0)
            throw new AppError(
                getReasonPhrase(StatusCodes.BAD_REQUEST),
                StatusCodes.BAD_REQUEST
            );

        const deletedtripss = await this.trips.deleteTrips(
            tripIds
        );

        return AppResponse(req, res, StatusCodes.OK, {
            message: `${deletedtripss.deletedCount} trips deleted.`,
        });
    }

    async getTripsStats(req: Request, res: Response) {

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
                                    avgtripsMins: { $avg: "$tripMins" }
                                }
                            }
                        ],
                        tripDataAverage: [
                            {
                                $project: {
                                    distancePertrips: {
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
                                    avgKmPerHour: { $avg: "$distancePertrips" }
                                }
                            }
                        ],
                        sixhrIntervalDataFortripsGroup: [
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

        const result = await this.trips.aggregateTrips(query)

        return AppResponse(req, res, StatusCodes.OK, result)
        //trips count, trip count by status,trip ratio 
    }





}

export const trips = new TripsController(TripsServiceLayer);

export default TripsController
