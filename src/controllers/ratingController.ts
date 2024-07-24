import { StatusCodes, getReasonPhrase} from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import RatingService, {
    ratingServiceLayer,
} from "../services/ratingService";
import { Request, Response } from "express";
import { IRating } from "../model/interfaces";
import AppResponse from "../utils/helpers/AppResponse";
import { MatchQuery, SortQuery } from "../../types/types";
import { sortRequest } from "../utils/helpers/sortQuery";
import { RideServiceLayer } from "../services/rideService";
import { Types } from "mongoose";
import { ROLES } from "../config/enums";

class RatingController {
    private ratings: RatingService;

    constructor(service: RatingService) {
        this.ratings = service;
    }

    createRating = async(req: Request, res: Response) => {

        const data: Omit<IRating, "rideId"> & { rideId  : string} = req.body;

        const rideData =  await RideServiceLayer.getRideById(data.rideId,  "createdBy") 

            if(!rideData) throw new AppError(getReasonPhrase(StatusCodes.BAD_REQUEST), StatusCodes.BAD_REQUEST)

            if(rideData?.riderId?.toString() !== req.user && req.role in [ROLES.DRIVER, ROLES.RIDER]) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)

        
        const createdRating = await this.ratings.createRating({...data,  rideId : new Types.ObjectId(data.rideId)});


        return AppResponse(req, res, StatusCodes.CREATED, {
            message: "Rating created successfully",
            data: createdRating,
        });
    }


    getRatings = async(req: Request, res: Response) => {
        const data: {
            ratingId: string,
            dateFrom?: Date,
            dateTo?: Date,
            cursor?: string,
            sort: string,
        }
        = req.body;

        const matchQuery: MatchQuery = {};

        if (data?.ratingId) {
            matchQuery._id = { $eq: data?.ratingId };
        
        if (data?.dateFrom) {
            matchQuery.createdAt = { $gte: new Date(data.dateFrom), $lte: data?.dateTo ?? new Date(Date.now()) };
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

        const result = await this.ratings.findRatings(query);

        const hasData = result?.data?.length === 0;

        return AppResponse(
            req,
            res,
            hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            {
                message: hasData
                    ? `ratings retrieved succesfully`
                    : `No ratings were found for this request `,
                data: result,
            }
        );
    }
}

    getRatingById = async(req: Request, res: Response) => {

        const ratingId: string = req.params.id;

        const result = await this.ratings.getRatingById(ratingId);



        if (!result)
            throw new AppError(
                "No rating was found for this request",
                StatusCodes.NOT_FOUND
            );

        return AppResponse(req, res, StatusCodes.OK, {
            message: "rating retrieved successfully",
            data: result,
        });
    }

    updateRating = async (req: Request, res: Response) =>  {

        const data: IRating & { ratingId: string } = req.body;


        const { ratingId, ...rest } = data;


        const updatedRating = await this.ratings.updateRating({
            docToUpdate: { _id : {$eq : ratingId}},
            updateData: {
                $set: {
                    ...rest,
                },
            },
            options: {
                new: true,
                select: "_id ",
            },
        });

        if (!updatedRating)
            throw new AppError(
                "Error : Update to rating failed",
                StatusCodes.NOT_FOUND
            );



        return AppResponse(req, res, StatusCodes.OK, {
            message: "rating updated successfully",
            data: updatedRating,
        });
    }

   
    getUserRatingStats= async(req: Request, res: Response) =>  {

        const data: {
            userId?: string,
            state?: string,
            town?: string,

        } = req.body

        const matchQuery: MatchQuery = {
            // createdAt: { $gte: new Date(data.dateFrom), $lte: data?.dateTo ?? new Date(Date.now()) }
        };

        if (data?.userId) {
            matchQuery.userId = { $eq: data.userId };
        }

       

        const query = {
            pipeline: [
                { $match: matchQuery },
                {
                    $facet: {
                        count: [{ $count: "total" }],
                        
                        avgRating: [ 
                            {
                            $group : { 
                                _id : null, 
                                totalRating : { $sum : "$rating"}, 
                                totalCount : { $sum : 1}
                            }
                            }, 
                            { 
                                $project : { 
                              averageRating : { 
            $multiply : [ 
                 { 
                    $divide : [ "$rating", {$multiply : ["$totalCount" , 5]  }]
                 } , 5
            ]
         }
                                }
                            }
                        ]

                       
                    }
                },
                {$project : {
                    count : { $arrayElemAt : ["$count.total", 0]} ,
                    avgRating: { $arrayElemAt: ["$avgRating.averageRating", 0] } 
                }
            }
            ]
        };

        //@ts-expect-error //ts doesnt recognize the stage correctly
        const result = await this.ride.aggregateRides(query)

        return AppResponse(req, res, StatusCodes.OK, result)


    }

    deleteRatings = async (req: Request, res: Response) =>  {
        const data: { ratingIds: string[] } = req.body;
    
        const { ratingIds } = data;
    
        if (ratingIds.length === 0)
          throw new AppError(
            getReasonPhrase(StatusCodes.BAD_REQUEST),
            StatusCodes.BAD_REQUEST
          );
    
        const deletedratings = await this.ratings.deleteRatings(
          ratingIds
        );
    
        return AppResponse(req, res, StatusCodes.OK, {
          message: `${deletedratings.deletedCount} bus stations deleted.`,
        });
      }

}

export const Rating = new RatingController(ratingServiceLayer);

export default Rating;
