import { RideRequestServiceLayer } from './../services/rideRequestService';

import {  ROLES } from './../config/enums';
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import RideService, {
    RideServiceLayer,
} from "../services/rideService";
import { Request, Response } from "express";
import { IRide, Place, CancellationData, Coordinates, IPackageSchedule, IRideSchedule, } from "../model/interfaces";
import AppResponse from "../utils/helpers/AppResponse";
import { MatchQuery, SortQuery } from "../../types/types";
import { sortRequest } from "../utils/helpers/sortQuery";
import { ClientSession, Types } from "mongoose";
import { PackageScheduleRequestServiceLayer } from "../services/packageScheduleRequestService";
import PackageSchedule from "../model/packageSchedule";
import { retryTransaction } from '../utils/helpers/retryTransaction';
import { distanceBetweenCoordinates } from '../utils/helpers/distanceBetweenTwoPoints';
import { isNotAuthorizedToPerformAction } from '../utils/helpers/isAuthorizedForAction';
import { TownServiceLayer } from '../services/townService';
import { DocumentsServiceLayer } from '../services/documentsService';

import State from '../model/state';
import Country from '../model/country';
import { COMPANY_NAME } from '../config/constants/base';


class RideController {
    private ride: RideService
    constructor(service: RideService) {
        this.ride = service;
    }


    async startScheduledRide(req: Request, res: Response) {
        //Create a ride and assign it to a trip 
        const data: IRideSchedule  = req.body
  
     
        const isNotDriver = req.user !== data.driverId.toString() 

        if(isNotAuthorizedToPerformAction(req) || isNotDriver)  throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN),StatusCodes.FORBIDDEN)


        const rideRequestData =  await RideRequestServiceLayer.getRideRequestById(data.rideRequest.toString() ,  "" )

        if(!rideRequestData) throw new AppError(getReasonPhrase(StatusCodes.NOT_FOUND), StatusCodes.NOT_FOUND)

        const rideData: IRide = {
            status: "ongoing",
            initialStatus: "scheduled",
            driverId: data.driverId,
            tripId: new Types.ObjectId(data.tripId),
            riderId: rideRequestData?.riderId,
            pickedUp: true,
            pickupTime: new Date(),
            type: rideRequestData?.type === "solo" ? "solo" : "share",
            // category: data.category,
            acceptedFare: data.driverBudget,
            destination: rideRequestData?.destination,
            origin:     rideRequestData?.pickupPoint,
            seatsOccupied: rideRequestData?.numberOfSeats,
            pickupStation: rideRequestData.pickupPoint,
            rideTotalDistance: rideRequestData?.totalRideDistance,
            friendData: rideRequestData?.friendData
        }


        const newStartedRide = await this.ride.createRide(rideData)


        return AppResponse(req, res, StatusCodes.CREATED, {
            message: "New ride created successfully",
            data: newStartedRide
        })
    }


    async startScheduledPackageRide(req: Request, res: Response) {

        const data: { tripId: string, origin: Place, packageScheduleRequestId: string } = req.body


        const packageRequestData = await PackageScheduleRequestServiceLayer.getPackageScheduleRequestById(data.packageScheduleRequestId, [
            {
                path: "packageScheduleId",
                model: PackageSchedule
            }
        ])
        if (!packageRequestData) throw new AppError(getReasonPhrase(StatusCodes.BAD_REQUEST), StatusCodes.BAD_REQUEST)

       
        const isNotRequestCreator = req.user !== packageRequestData.createdBy?.toString()

        if (isNotAuthorizedToPerformAction(req) || isNotRequestCreator) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)

        const packageScheduleData = packageRequestData.packageScheduleId as unknown as IPackageSchedule

        const rideData: IRide = {
            status: "ongoing",
            initialStatus: "scheduled",
            driverId: packageRequestData.createdBy,
            tripId: new Types.ObjectId(data.tripId),
            riderId: packageScheduleData.createdBy,
            pickedUp: true,
            pickupTime: new Date(),
            type: "package",
            packageCategory: packageScheduleData.type ,
            packageDetails: packageScheduleData.packageDetails,
            acceptedFare: packageScheduleData.acceptedBudget!,
            destination: packageScheduleData.destinationAddress,
            origin: packageScheduleData.pickupAddress,
            
            packageRequestId: new Types.ObjectId(data.packageScheduleRequestId),
            rideTotalDistance: packageScheduleData.totalDistance,
        }

      

        const newPackageRide = await this.ride.createRide(rideData)


        return AppResponse(req, res, StatusCodes.CREATED, {
            message: "New ride created successfully",
            data: newPackageRide
        })

    }

    async createLiveRide(req: Request, res: Response) {

        const data: IRide = req.body;


        const rideData: IRide = {
            ...data,
            initialStatus: "none",
            status: "ongoing",
            type: data.type === "solo" ? "solo" : "share",

        }

        const createdRide = await this.ride.createRide(rideData);

        return AppResponse(req, res, StatusCodes.CREATED, {
            message: "Live ride created successfully",
            data: createdRide,
        });
    }

    async createLivePackageRide(req: Request, res: Response) {


        //we  can have stop to stop package rides, this will only be for live rides and this is for vehicles who can pickup and drop at a bus stop
        const data: IPackageSchedule & { driverId: string, acceptedFare: number, tripId: string } = req.body;


        const rideData: IRide = {
            status: "ongoing",
            initialStatus: "none",
            driverId: new Types.ObjectId(data.driverId),
            tripId: new Types.ObjectId(data.tripId),
            riderId: data.createdBy,
            pickedUp: true,
            pickupTime: new Date(Date.now()),
            type: "package",
            packageCategory: data.type,
            packageDetails: data.packageDetails,
            acceptedFare: data.acceptedFare,
            destination: data.destinationAddress,
            origin: data.pickupAddress,
            rideTotalDistance: data.totalDistance,

        }

        const createdRide = await this.ride.createRide(rideData);

        return AppResponse(req, res, StatusCodes.CREATED, {
            message: "Live ride created successfully",
            data: createdRide,
        });
    }

    async endRide(req: Request, res: Response) {
        const data: {
            rideId: string
            tripId: string,
            userId: string,
            origin: Coordinates
            destination: Coordinates,
            currentLocation: Place
        } = req.body



        const result = await retryTransaction(this._endRideSession, 1, { 
            ...data, 
            allowedRoles : req.allowedRoles,
            allowedSubRoles : req.allowedSubRoles,
            userRole : req.subRole
        })

        return AppResponse(req, res, StatusCodes.OK, {
            message: "Ride ended  successfully",
            data: result
        })
    }

    async _endRideSession(args: {
        rideId: string
        userId: string
        userRole: number
        userSubRole? : number
        allowedRoles : number[]
        allowedSubRoles : number[] 
        tripId: string,
        origin: Coordinates
        destination: Coordinates,
        currentLocation: Place
    }, session: ClientSession) {

        const result = await session.withTransaction(async () => {
            const rideData = await this.ride.getRideById(args.rideId, "pickupStation origin destination seatsOccupied category type acceptedFare rideTotalDistance driverIdroi")

            if (!rideData) throw new AppError("Something went wrong.Please try again", StatusCodes.BAD_REQUEST)


            if (!(args.allowedRoles.includes(args.userRole)) || (args.allowedSubRoles.length > 0 && args.userSubRole && !(args?.allowedSubRoles?.includes(args.userSubRole)) && rideData.driverId.toString() !== args.userId)) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)  
            
            
            const originalDestination = rideData?.destination?.location?.coordinates
            const currentLocation = args.currentLocation.location.coordinates

            const distanceAwayFromOriginalDestination = distanceBetweenCoordinates(originalDestination, currentLocation)

            if (!distanceAwayFromOriginalDestination || typeof distanceAwayFromOriginalDestination !== 'number') {
                throw new AppError(getReasonPhrase(StatusCodes.BAD_REQUEST), StatusCodes.BAD_REQUEST)
            }

            let newFare: number = 0
            let hasExtraKMs = 1

            if (distanceAwayFromOriginalDestination > 1000) {
                //Recalculate the bill
                const costPerKm = rideData.acceptedFare / rideData.rideTotalDistance

                const costForExtraKMs = distanceAwayFromOriginalDestination * costPerKm

                newFare = costForExtraKMs + rideData.acceptedFare + 50



            } else if (distanceAwayFromOriginalDestination < 0) {

                const costPerKm = rideData.acceptedFare / rideData.rideTotalDistance

                const costForExtraKMs = distanceAwayFromOriginalDestination * costPerKm

                newFare = rideData.acceptedFare - costForExtraKMs + 50

                hasExtraKMs = -1
            }
            else {
                newFare = rideData.acceptedFare
                hasExtraKMs = 0
            }


            const driverCommission = 100 + (0.05 * rideData.acceptedFare)

            const riderCommission = hasExtraKMs === 0 ? 0 : hasExtraKMs === 1 ? 50 : 50


            await this.ride.updateRide({
                docToUpdate: { _id: args.rideId },
                updateData: {
                    $set: {
                        droffOffLocation: args.currentLocation,
                        rideTotalDistance: rideData.rideTotalDistance,
                        driverCommission,
                        riderCommission,
                        totalCommission: riderCommission + driverCommission,
                        comissionPaid: false,
                        status: "completed",
                        alighted: true
                    }
                },
                options: {
                    new: false,

                }

            })


            return newFare
        })

        return result
    }

    async cancelRide(req: Request, res: Response) {

        const data: { userId: string,  cancellationData: CancellationData, rideId: string } = req.body

        if (req.user !== data.userId  || isNotAuthorizedToPerformAction(req)) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)  

        const cancelledRide = await this.ride.updateRide({
            docToUpdate: { _id: data.rideId },
            updateData: {
                $set: {
                    cancellationData: {
                        status: true,
                        initiator: new Types.ObjectId(data.userId),
                        initiatedBy: req.role === ROLES.DRIVER ? "driver" : req.role === ROLES.RIDER ? "rider" : "admin" ,
                        cancellationReason: data.cancellationData.cancellationReason,
                        driverDistanceFromPickup: data.cancellationData.driverDistanceFromPickup,
                        driverEStimatedETA: data.cancellationData.driverEstimatedETA
                    }
                }
            },
            options: {
                new: false,
                select: "_id"
            }
        })


        if (!cancelledRide) throw new AppError(getReasonPhrase(StatusCodes.BAD_REQUEST), StatusCodes.BAD_REQUEST)

        return AppResponse(req, res, StatusCodes.OK, {
            message: "Ride cancelled succeffully",
            data: { _id: cancelledRide._id }
        })
    }

    async canStartRide(req: Request, res: Response) {
        const town = req.params.id
        const user = req.user as string


        const response = await retryTransaction(this.#canStartRideSession, 1, { town, user })

        if (!response) throw new AppError(`Please complete your verification in order to start a ride or send a package. Help us keep ${COMPANY_NAME} safe for you and other users`, StatusCodes.FORBIDDEN)


        return AppResponse(req, res, StatusCodes.OK, { message: "Driver is verified and can begin trip" })

    }

     async  #canStartRideSession(args: { user: string, town: string }, session: ClientSession) {

        const canStartRide: boolean = await session.withTransaction(async () => {


            //Remember , the document names must match the names in the required Docs field
            const documents = await TownServiceLayer.getTownById(
                args.town,
                "_id requiredDocs",
                session,
                [
                    {
                        path: "Country",
                        select: "requiredRiderDocs",
                        model: Country
                    },

                    {
                        path: "State",
                        select: "requiredRiderDocs",
                        model: State
                    }
                ]
            )
            if (!documents) throw new AppError("Something went wrong. Please try again", StatusCodes.NOT_FOUND)

            const documentNames = [
                ...documents.requiredRiderDocs,
                //@ts-expect-error THis will be populated
                ...documents.country.requiredRiderDocs,
                //@ts-expect-error THis will be populated
                ...documents.state.requiredRiderDocs
            ]

            const documentNamesArray = documentNames.map(document => document.name)


            const documentsAvailable = await DocumentsServiceLayer.getDocumentsWithPopulate({
                query: {
                    userId: args.user,
                    status: "assessed",
                    isVerified: true,
                    archived: false
                },
                select: "name"

            })


        
            let isVerified: boolean = true

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

        return canStartRide

    }

    async getRides(req: Request, res: Response) {
        const data: {
            rideId?: string;
            cursor?: string;
            town?: string;
            state?: string;
            country?: string;
            sort?: string;
            tripId? : string;
            dateFrom? : Date;
            dateTo? : Date;
        } = req.body;

        const matchQuery: MatchQuery = {};

        if (data?.rideId) {
            matchQuery._id = { $eq: data?.rideId };
        }

        if (data?.dateFrom) {
            matchQuery.createdAt = { $gte: new Date(data.dateFrom), $lte: data?.dateTo ?? new Date(Date.now()) };
        }

        if (data?.rideId) {
            matchQuery.tripId = { $eq: data?.tripId };
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

        const result = await this.ride.findRides(query);

        const hasData = result?.data?.length === 0;

        return AppResponse(
            req,
            res,
            hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            {
                message: hasData
                    ? `Rides retrieved succesfully`
                    : `No rides were found for this request `,
                data: result,
            }
        );
    }

    async getRideById(req: Request, res: Response) {

        const rideId: string = req.params.id;

        const result = await this.ride.getRideById(rideId);

        if (!result)
            throw new AppError(
                "No ride was found for this request",
                StatusCodes.NOT_FOUND
            );

        return AppResponse(req, res, StatusCodes.OK, {
            message: "Ride retrieved successfully",
            data: result,
        });
    }

    // async updateRide(req: Request, res: Response) {

    //     const data: IRide & { rideId: string } = req.body;

    //     const { rideId, ...rest } = data;

    //     const updatedride = await this.ride.updateRide({
    //         docToUpdate: rideId,
    //         updateData: {
    //             $set: {
    //                 ...rest,
    //             },
    //         },
    //         options: {
    //             new: true,
    //             select: "_id placeId",
    //         },
    //     });

    //     if (!updatedride)
    //         throw new AppError(
    //             "Error : Ride update failed. Please try again",
    //             StatusCodes.NOT_FOUND
    //         );

    //     return AppResponse(req, res, StatusCodes.OK, {
    //         message: "ride updated successfully",
    //         data: updatedride,
    //     });
    // }


    async getOutstandingDriverRideSettlements(req: Request, res: Response) {

        const driverId = req.params.id

        const unsettledRidesAndCommission = await RideServiceLayer.aggregateRides({
            pipeline: [{

                $match: {
                    driverId: driverId,
                    status: "completed",
                    commissionPaid: false,
                },
            },
            {
                $group: {
                    _id: null,
                    totalBill: { $sum: "$totalCommission" },
                    documents: { $push: "$_id" },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalBill: 1,
                    documents: 1,
                },
            }



            ]
        });

        if (!unsettledRidesAndCommission) throw new AppError(getReasonPhrase(StatusCodes.NOT_FOUND), StatusCodes.NOT_FOUND)

        if (driverId !== req.user && req.role !== ROLES.ADMIN) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)

        return AppResponse(req, res, StatusCodes.OK, {
            message: "Settlement data retrieved successfully",
            data: {
                ...unsettledRidesAndCommission,
            },
        });

    }

    async getRideStats(req: Request, res: Response) {
        const data: {
            dateFrom: Date,
            dateTo: Date,
            country?: string,
            state?: string,
            town?: string,
            type?: Pick<IRide, "type">
            user?: string,
            userType?: "driver" | "rider"



        } = req.body

        const matchQuery: MatchQuery = {
            createdAt: { $gte: new Date(data.dateFrom), $lte: data?.dateTo ?? new Date(Date.now()) }
        };


        if (data?.country) {
            matchQuery.country = { $eq: data?.country };
        }

        if (data?.state) {
            matchQuery.state = { $eq: data?.state };
        }

        if (data?.town) {
            matchQuery.town = { $eq: data?.town };
        }


        if (data.type) {
            matchQuery.type = { $eq: data.type }
        }

        if (data.user && data?.userType === "driver") {
            matchQuery.driverId = { $eq: data.user }
        }

        if (data.user && data?.userType === "rider") {
            matchQuery.riderId = { $eq: data.user }
        }


        const query = {
            pipeline: [
                // { $match: matchQuery },
                {
                    $facet: {
                        count: [{ $count: "total" }],
                        avgRideMins: [
                            {
                                $group: {
                                    _id: null,
                                    avgRideMins: {
                                        $avg: {
                                            $divide: [
                                                { $subtract: ["$dropoffTime", "$pickupTime"] },
                                                60000
                                            ]
                                        }
                                    }
                                }
                            }
                        ],
                        cancellationReasonBreakdown: [
                            {
                                $group: {
                                    _id: "$cancellationData.reason",
                                    count: { $sum: 1 }
                                }
                            }
                        ],

                        timingBeforeCancellation: [
                            {
                                $bucket: {
                                    groupBy: "$cancellationData.distanceEstimatedETA",
                                    boundaries: [0, 6, 16],
                                    default: ">15mins",
                                    output: { count: { $sum: 1 } }
                                }
                            }
                        ],
                        distanceBeforeCancellation: [
                            {
                                $bucket: {
                                    groupBy: "$cancellationData.driverDistanceFromPickup",
                                    boundaries: [0, 1, 2, 4],
                                    default: ">4km",
                                    output: { count: { $sum: 1 } }
                                }
                            }
                        ],
                        cancellationInitiatorCounts: [
                            {
                                $group: {
                                    _id: "$cancellationData.initiatedBy",
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        rideDataAverage: [
                            {
                                $project: {
                                    averageSpeedPerRide: {
                                        $divide: [
                                            "$distance",
                                            { $divide: [{ $subtract: ["$dropoffTime", "$pickupTime"] }, 3600000] }
                                        ]
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    avgKmPerHour: { $avg: "$averageSpeedPerRide" }
                                }
                            }
                        ],
                        sixhrIntervalDataForRideGroup: [
                            {
                                $project: {
                                    interval: {
                                        $switch: {
                                            branches: [
                                                { case: { $lte: [{ $hour: "$createdAt" }, 6] }, then: "00:00 - 06:00" },
                                                { case: { $lte: [{ $hour: "$createdAt" }, 12] }, then: "06:00 - 12:00" },
                                                { case: { $lte: [{ $hour: "$createdAt" }, 18] }, then: "12:00 - 18:00" },
                                                { case: { $lte: [{ $hour: "$createdAt" }, 24] }, then: "18:00 - 00:00" }
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
                        rideCountsByTypeSplitByCategory: [
                            {
                                $group: {
                                    _id: {
                                        month: { $month: "$createdAt" },
                                        type: "$type",
                                        category: "$category"
                                    },
                                    count: { $sum: 1 }
                                }
                            },
                            {
                                $group: {
                                    _id: {
                                        month: "$_id.month",
                                        category: "$_id.category"
                                    },
                                    types: { $push: { k: "$_id.type", v: "$count" } }
                                }
                            },
                            {
                                $group: {
                                    _id: "$_id.month",
                                    categoriesCounts: { $push: { k: "$_id.category", v: { $arrayToObject: "$types" } } }
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    month: "$_id",
                                    categoriesCount: { $arrayToObject: "$categoriesCounts" }
                                }
                            }
                        ],
                        topDestinationTown: [
                            {
                                $lookup: {
                                    from: "Town",
                                    localField: "dropOffTown",
                                    foreignField: "_id",
                                    as: "dropOffTownData"
                                }
                            },
                            { $unwind: "$dropOffTownData" },
                            {
                                $group: {
                                    _id: "$dropOffTownData._id",
                                    name: { $first: "$dropOffTownData.name" },
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { count: -1 } },
                            { $limit: 10 }
                        ],
                        topDestinationStates: [
                            {
                                $lookup: {
                                    from: "State",
                                    localField: "dropOffState",
                                    foreignField: "_id",
                                    as: "dropOffStateData"
                                }
                            },
                            { $unwind: "$dropOffStateData" },
                            {
                                $group: {
                                    _id: "$dropOffStateData._id",
                                    name: { $first: "$dropOffStateData.name" },
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { count: -1 } },
                            { $limit: 10 }
                        ],
                        topDestinationCountries: [
                            {
                                $lookup: {
                                    from: "Country",
                                    localField: "dropOffCountry",
                                    foreignField: "_id",
                                    as: "dropOffCountryData"
                                }
                            },
                            { $unwind: "$dropOffCountryData" },
                            {
                                $group: {
                                    _id: "$dropOffCountryData._id",
                                    name: { $first: "$dropOffCountryData.name" },
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { count: -1 } },
                            { $limit: 10 }
                        ],
                        topOriginationTown: [
                            {
                                $lookup: {
                                    from: "Town",
                                    localField: "pickupTown",
                                    foreignField: "_id",
                                    as: "pickupTownData"
                                }
                            },
                            { $unwind: "$pickupTownData" },
                            {
                                $group: {
                                    _id: "$pickupTownData._id",
                                    name: { $first: "$pickupTownData.name" },
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { count: -1 } },
                            { $limit: 10 }
                        ],
                        topOriginationState: [
                            {
                                $lookup: {
                                    from: "State",
                                    localField: "pickupState",
                                    foreignField: "_id",
                                    as: "pickupStateData"
                                }
                            },
                            { $unwind: "$pickupStateData" },
                            {
                                $group: {
                                    _id: "$pickupStateData._id",
                                    name: { $first: "$pickupStateData.name" },
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { count: -1 } },
                            { $limit: 10 }
                        ],
                        topOriginatingCountry: [
                            {
                                $lookup: {
                                    from: "Country",
                                    localField: "pickupCountry",
                                    foreignField: "_id",
                                    as: "pickupCountryData"
                                }
                            },
                            { $unwind: "$pickupCountryData" },
                            {
                                $group: {
                                    _id: "$pickupCountryData._id",
                                    name: { $first: "$pickupCountryData.name" },
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { count: -1 } },
                            { $limit: 10 }
                        ],
                        averageCompletionRate: [
                            {
                                $group: {
                                    _id: null,
                                    average: { $avg: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    average: 1
                                }
                            }
                        ],

                        averageCancellationRate: [
                            {
                                $group: {
                                    _id: null,
                                    average: { $avg: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } }
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    average: 1
                                }
                            }
                        ],

                        averageDistance: [
                            {
                                $group: {
                                    _id: null,
                                    average: { $avg: "$distance" }
                                }
                            }
                        ],
                        averagePaidFare: [
                            {
                                $group: {
                                    _id: null,
                                    average: { $avg: "$paidFare" }
                                }
                            }
                        ],
                        totalFare: [
                            {
                                $group: {
                                    _id: null,
                                    totalFare: { $sum: "$paidFare" }
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    totalFare: 1
                                }
                            }
                        ],

                        averageAcceptedFare: [
                            {
                                $group: {
                                    _id: null,
                                    average: { $avg: "$acceptedFare" }
                                }
                            }
                        ],
                        averageCommission: [
                            {
                                $group: {
                                    _id: null,
                                    average: { $avg: "$totalCommission" }
                                }
                            }
                        ],
                        groupByMonthOfYear: [
                            {
                                $group: {
                                    _id: { month: { $month: "$createdAt" }, status: "$status" },
                                    count: { $sum: 1 }
                                }
                            },
                            {
                                $group: {
                                    _id: "$_id.month",
                                    statusCounts: { $push: { k: "$_id.status", v: "$count" } }
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    month: "$_id",
                                    statusCounts: { $arrayToObject: "$statusCounts" }
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
        };

        //@ts-expect-error //ts doesnt recognize the stage correctly
        const result = await this.ride.aggregateRides(query)

        return AppResponse(req, res, StatusCodes.OK, result)

    }

    //Admins only
    async deleteRides(req: Request, res: Response) {
        const data: { RideIds: string[] } = req.body;

        const { RideIds } = data;

        if (RideIds.length === 0)
            throw new AppError(
                getReasonPhrase(StatusCodes.BAD_REQUEST),
                StatusCodes.BAD_REQUEST
            );

        const deletedRides = await this.ride.deleteRides(
            RideIds
        );

        return AppResponse(req, res, StatusCodes.OK, {
            message: `${deletedRides.deletedCount} rides deleted.`,
        });
    }
}

export const Ride = new RideController(RideServiceLayer);

export default Ride;
