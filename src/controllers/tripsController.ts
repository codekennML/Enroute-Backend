
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
import { ClientSession, Types } from "mongoose";
import { TownServiceLayer } from "../services/townService";
import Country from "../model/country";
import State from "../model/state";
import { DocumentsServiceLayer } from "../services/documentsService";
import { COMPANY_NAME } from '../config/constants/base';
import { UserServiceLayer } from '../services/userService';
import { VehicleServiceLayer } from '../services/vehicleService';
import { RideServiceLayer } from '../services/rideService';
import { isNotAuthorizedToPerformAction } from '../utils/helpers/isAuthorizedForAction';
import { addDays, addMinutes, differenceInMilliseconds,  } from 'date-fns';
import { tripScheduleServiceLayer } from '../services/tripScheduleService';
import { batchPushQueue, billingQueue} from '../services/bullmq/queue';
import { RideRequestServiceLayer } from '../services/rideRequestService';


class TripsController {
    private trips: tripsService;

    constructor(service: tripsService) {
        this.trips = service;
    }

    createTrip = async(req: Request, res: Response) => {

        const data: Omit<ITrip, "departureTime"> = req.body;

    
        const user =  req.user 

        if(!user) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)

        const userRole  = await UserServiceLayer.getUserById(user, "roles") 

        if(!userRole || !userRole?.roles ) throw new AppError(getReasonPhrase(StatusCodes.BAD_REQUEST), StatusCodes.BAD_REQUEST)

         const isImpostor = isNotAuthorizedToPerformAction(req)

        if(userRole?.roles !== ROLES.DRIVER || data?.driverId?.toString() !== req.user || isImpostor) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)

        const createdtrip = await this.trips.createTrip({ ...data, departureTime : new Date()});

        return AppResponse(req, res, StatusCodes.CREATED, {
            message: "New trip created successfully",
            data: createdtrip,
        });
    }

    
   createTripFromTripSchedule =  async (req : Request, res : Response) =>{

        const data : { tripScheduleId : string } = req.body 

        //Find the trip schedule,  craete the trip and send push to all riders subscribed to the schedule
        const result =  await retryTransaction(this._createTripFromScheduleSession,  1, { tripScheduleId : data.tripScheduleId})

        const rideRequestInfo = await RideRequestServiceLayer.aggregateRideRequests([
                {
                    $match: { tripScheduleId: data.tripScheduleId }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "riderId",
                        foreignField: "_id",
                        pipeline: [
                            {
                                $project: {
                                    deviceToken: 1
                                }
                            }
                        ],
                        as: "$riderPushId"
                    }
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
                                    lastName : 1 
                                }
                            }
                        ],
                        as: "$driverName"
                    }
                },
                {
                    $unwind: "$driverName"
                },
              
                {
                    $project : { 
                        riderPushId : 1 , 
                        _id : 1,
                        driverName : 1


                    }
                }
                
            ]
        )
    
        if(!rideRequestInfo || rideRequestInfo.length === 0 ) return AppResponse(req, res, StatusCodes.CREATED, { 
            message : "Trip created successfully"
        }) //No need to error out, the driver will call the riders usually or text them

       

        const info  =  rideRequestInfo.map(rideRequest => 
          ({
            name: `New_Trip_Alert_${result}_${rideRequest?._id}`,
            data: {
                deviceTokens : rideRequest.deviceToken,
                message : { 
                    body : `${rideRequest?.driverName?.firstName} ${rideRequest?.driverName?.lastName} is on the way for your scheduled ride.Prepare to meet up at the agreed pickup location promptly  `, 
                    id : rideRequest?._id, 
                    screen : "rideRequest"
                }
            },
            opts: { removeOnFail: true, removeOnComplete: true, priority: 10 }
        }))

    
        await batchPushQueue.addBulk(info)
    
        return AppResponse(req, res, StatusCodes.CREATED, {
            message: "Trip created successfully"
        })
    } 

    async _createTripFromScheduleSession (args : { tripScheduleId : string}, session : ClientSession){
  
        const result = await session.withTransaction(async() => {
          
        const tripSchedule = await tripScheduleServiceLayer.updateTripSchedule({ 
            docToUpdate : { _id : args.tripScheduleId},
            updateData : { status : "started"}, 
            options : { new : true , session}
        })
          
        if(!tripSchedule) throw new AppError("An Error occured. Please try again", StatusCodes.NOT_FOUND)

        if( new Date(Date.now()) > addMinutes(new Date(tripSchedule.departureTime), 16 )) throw new AppError(`This trip is no longer available. Trips must be fulfilled within 15mins of their departure time`, StatusCodes.FORBIDDEN)

        const driverVehicle =  await VehicleServiceLayer.findVehicles({
            query : { 
                driverId : tripSchedule.driverId, 
                isRejected : false,
                status : "assessed", 
                isVerified : true , 
                isArchived : false
            }, 
            select : "_id"
        })

        if(!driverVehicle || driverVehicle.length === 0) throw new AppError("No verified vehicle to assign to this trip. Please ensure you have a verified vehicle.", StatusCodes.FORBIDDEN)

        const tripData=  {
            driverId : tripSchedule.driverId, 
            origin : tripSchedule.origin, 
            destination : tripSchedule.destination,
            distance : tripSchedule.routeDistance, 
            vehicleId: driverVehicle[0]._id, 
            departureTime : new Date() , 
            initialStatus : "scheduled" as const,
            route  : tripSchedule.route,
            status : "ongoing" as const,
            seatAllocationsForTrip : tripSchedule.seatAllocationsForTrip
        }

        const createdTrip  =  await this.trips.createTrip(tripData, session )

       
        if(!createdTrip) throw new AppError("An Error Occured.Please try again",  StatusCodes.INTERNAL_SERVER_ERROR)
       
        return createdTrip[0]._id

        }) 
 

        return result 
    }


   getTrips =  async (req: Request, res: Response)  => {
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


        if (data?.driverId || req ?.params?.id) {
            if(req.params?.id) {
                matchQuery.driverId = { $eq:  new Types.ObjectId(req.params?.id) };
            }
            else {
                matchQuery.driverId = { $eq:  new Types.ObjectId(data?.driverId)  };
               
            }
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
            aggregatePipeline: [
                { $limit: 101 }, 
                sortQuery
            ],
            pagination: { pageSize: 100 },
        };
  
        const result = await this.trips.findTrips(query);

        const driver = result?.data && result?.data?.length > 0 && result.data[0]?.driverId

        const isImpostor =  isNotAuthorizedToPerformAction(req)

        if (driver.toString() !== req.user && isImpostor ) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)


        const hasData = result?.data?.length > 0

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

 

   canStartTrip =  async (req: Request, res: Response) => {

        const town = req.params.id
        const user = req.user as string


        const response = await retryTransaction(this._canStartTripsSession, 1, { user, town })

        if (!response) throw new AppError(`Please complete your verification in order to start a trip. Help us keep ${COMPANY_NAME} safe for you and other users`, StatusCodes.FORBIDDEN)


        return AppResponse(req, res, StatusCodes.OK, { message: "Driver is verified and can begin trip" })

    }

    async _canStartTripsSession(args: { user: string, town: string }, session: ClientSession) {

        const canStartTrips: boolean = await session.withTransaction(async () => {


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
            if (!documents) throw new AppError("Something went wrong. Please try again", StatusCodes.NOT_FOUND, "No matching town found for driver attempting to start trip")

                let isVerified: boolean = true
   
    const documentNames = [
        ...documents.requiredDriverDocs, 
        //@ts-expect-error THis will be populated
        ...documents.country.requiredDriverDocs ,
            //@ts-expect-error THis will be populated
        ...documents.state.requiredDriverDocs
        ]
     
    const documentNamesArray =  documentNames.map(document => document.name)

    if(documentNamesArray.length > 0) {
        
    const documentsAvailable = await DocumentsServiceLayer.getDocumentsWithPopulate({
        query: {
            driverId: args.user,
            status: "assessed",
            isVerified: true,
            archived: false
        },
        select: "name"

    })

    const names = documentsAvailable.reduce((acc: string[], obj) => {
        acc.push(obj.name);
        return acc;
    }, []);


    for (const documentName of names) {

        if (!(documentName in documentNamesArray)) {
            isVerified = false
             return  isVerified
        }
    }

}
           
            const userInfo = await UserServiceLayer.getUserById(args.user, "paymentMethod firstname lastName")
        
            if(!userInfo) throw new AppError(`An Error occurred.Please try again`,  StatusCodes.NOT_FOUND)

            const hasValidPaymentMethod = userInfo?.paymentMethod

            const hasName =  userInfo?.firstName && userInfo?.lastName


            const vehicleVerified =  await VehicleServiceLayer.findVehicles ({ 
                query : { 
                    driverId: new Types.ObjectId(args.user),
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

            if (!vehicleVerified) throw new AppError(`An Error occurred`, StatusCodes.NOT_FOUND)

            
 
        
            if (!hasValidPaymentMethod || !hasValidPaymentMethod.isValid || !hasName) {
                isVerified = false
                return isVerified
            } 

            if(vehicleVerified?.length < 1 ) { 
                isVerified = false
                return isVerified
            }

          
            return isVerified
        })

        return canStartTrips

    }

   getTripById =  async (req: Request, res: Response) => {

        const tripId : string = req.params.id;
        
        console.log("trip", tripId)

        const result = await this.trips.getTripById(tripId, "");
    
        if (!result)
            throw new AppError(
                "No trip was found for this request",
                StatusCodes.NOT_FOUND
            );

        return AppResponse(req, res, StatusCodes.OK, {
            message: "Bus station retrieved successfully",
            data: result,
        });
    }

    updateTrip =  async (req: Request, res: Response) =>  {

        const data: Pick<ITrip, "origin" | "destination" | "departureTime" | "status" > & { tripId: string } = req.body;

        const { tripId, ...rest } = data;

        // if(status in rest && status === "crashed"){

            // TODO 
        //     //Send an emergency alert to slack channel 
        // }

        // if(status in rest && status === "paused"){

            // TODO Notify CX admin for followup to ensure safety of rider and driver, send last location too
        //     //Send an emergency alert to slack channel 
        // }

        console.log(tripId)

   

        const docToFind : Record<string , object| string | boolean > = { _id : { $eq: new Types.ObjectId(tripId) }}
     
        const tripData  = await this.trips.getTripById(tripId,  "driverId")

        if(!tripData) throw new AppError(getReasonPhrase(StatusCodes.NOT_FOUND), StatusCodes.NOT_FOUND)

       if(req.role === ROLES.DRIVER &&  tripData?.driverId.toString() !== req.user){ 
                throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)
              }

        console.log(docToFind)
     
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
                "Error : update to trip failed",
                StatusCodes.NOT_FOUND
            )

        return AppResponse(req, res, StatusCodes.OK, {
            message: "Trip updated successfully",
            data: updatedTrip,
        });
    }


    endTrip =   async (req : Request, res : Response) => { 

        const data :  { tripId : string,  driverId :string} =  req.body 

        if((req.user !== data.driverId && req.role in [ROLES.DRIVER, ROLES.RIDER]) || isNotAuthorizedToPerformAction(req)) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)

        //Check if there are any ongoing rides, with this tripId
      console.log(data.tripId)

        const ongoingRides =  await RideServiceLayer.aggregateRides({
          pipeline: [
                { $match : {
                     _id: { $eq: new Types.ObjectId(data.tripId) },
                      driverId: { $eq: new Types.ObjectId(data.driverId) },
                 $or : [ 
                { 
                    status : {$eq : "ongoing" }, 
                }, 
                {
                    status : { $eq: "paused"}
                }
            ]
        } }, 
               
                {
                  $facet : {
                   ongoingRideCount: [
                    {
                        $match: {                      
                            dropOffTime: { $exists: false }
                         },
                    },
                    {
                              $group: { _id: null, count: { $sum: 1 } }
                     } 
                    
], 

rideinTripsCount : [{
    $match : { 
    
        dropOffTime: { $exists: true  }
    }
} , 
    { 
        $group : { _id : null, count : {$sum  : 1}}
    }
]
                  } 
                }
                  , 
                //   {
                //     $project : { 
                //         rides : { arrayElemAt : [ "$ongoingRideCount.count", 0 ]}, 
                //           ridesInTrip: {
                //               arrayElemAt: ["$ongoingRideCount.count", 0  ]
                //  }}
                // }
          ]  
         
        })
          
        console.log(JSON.stringify(ongoingRides))
    
        if (!ongoingRides || ongoingRides.length === 0) {
            throw new AppError(`No existing trip data was found. Please try again`, StatusCodes.NOT_FOUND)
         }

        if (ongoingRides[0]?.rides > 0 ) {
            throw new AppError(`You have to drop off all your riders`, StatusCodes.FORBIDDEN)
        } 

        const updatedTrip =  await this.trips.updateTrip({ 
        docToUpdate : { 
        _id : { $eq : data.tripId }, 
        driverId : { $eq : data.driverId}
    },
        updateData : { 
            $set : { 
                endTime : new Date(),
                status : "completed"
            }
        },
        options : { new : true , select : "_id"}
        }) 
        //Push the driver Id into the billing queue for charge later 

        if(ongoingRides[0]?.ridesInTrip > 0 ){
            //Add the driver to the billing queue

        const now =  new Date()
        const tomorrow  = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 30, 0) , 1)
        const differenceInMs =  differenceInMilliseconds(now, tomorrow)

        await billingQueue.add(`trip_billing_info-${data.driverId}`,   data.driverId, { 
            removeOnComplete : true, 
            removeOnFail : true , 
            delay : differenceInMs
        })
        }

        return AppResponse(req, res, StatusCodes.OK, { 
            message : "Trip ended successfully",
            data : { _id : updatedTrip?._id}
        })

    }

    //Admins only
     deleteTrips =  async (req: Request, res: Response)  => {

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

     getTripsStats =  async (req: Request, res: Response) =>  {

        const data: {
            dateFrom?: Date,
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
            matchQuery.origin["country"]= { $eq: data?.country };
        }

        if (data?.state) {
            matchQuery.origin["state"] = { $eq: data?.state };
        }

        if (data?.town) {
            matchQuery.origin["town"] = { $eq: data?.town };
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

                        groupByMonthOfYear: [
                            {
                                $group: {
                                    _id: {
                                        month: { $month: "$createdAt" }
                                    },
                                    count: { $sum: 1 }
                                }
                            }
                        ], 

                        groupByStatusByMonthOfYear: [
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
console.log(JSON.stringify(query))
        const result = await this.trips.aggregateTrips(query)
        console.log(result)

        return AppResponse(req, res, StatusCodes.OK, {
            message : "Trips statistics retrieved successfully", 
            data : result
        })
        //trips count, trip count by status,trip ratio 
    }





}

export const trips = new TripsController(TripsServiceLayer);

export default TripsController
