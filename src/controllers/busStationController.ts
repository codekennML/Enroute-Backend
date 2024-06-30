import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import BusStationService, {
  BusStationServiceLayer,
} from "../services/busStationService";
import { Request, Response } from "express";
import { IBusStation } from "../model/interfaces";
import AppResponse from "../utils/helpers/AppResponse";
import { MatchQuery, SortQuery } from "../../types/types";
import { sortRequest } from "../utils/helpers/sortQuery";
import { Types} from 'mongoose'
import { ROLES } from "../config/enums";

class BusStationController {
  private busStation: BusStationService;

  constructor(service: BusStationService) {
    this.busStation = service;
  }

  async createBusStation(req: Request, res: Response) {
    const data: IBusStation = req.body;

    const createdBusStation = await this.busStation.createBusStation(data);

    return AppResponse(req, res, StatusCodes.CREATED, {
      message: "Bus station created successfully",
      data: createdBusStation,
    });
  }

  async suggestBusStation(req : Request,  res : Response) {
    const data: Omit<IBusStation, 'active' | 'suggested'> & { user : string} = req.body;

  
    const createdSuggestedBusStation = await this.busStation.createBusStation({ ...data , status : "suggested" , suggestedBy : new Types.ObjectId(data.user)});

    return AppResponse(req, res, StatusCodes.CREATED, {
      message: "Bus station suggestion sent  successfully",
      data: createdSuggestedBusStation,
    });
  }

  async considerSuggestedStation (req : Request,  res : Response ) {
    const data : { stationId : string, decision : "approved" | "rejected" } =  req.body  

    const updatedStation =  await this.busStation.updateBusStation({
      docToUpdate : { 
        _id : { $eq : data.stationId}
      }, 
      updateData : { 
        $set : { 
          ...(data.decision === "approved" && {status : "active" , approvedBy : req.user}),
          ...(data.decision === "rejected" && { status: "rejected", approvedBy: req.user })
        }
      }, 
      options : { new : true ,  select : "_id"}
    }) 

    if(!updatedStation) throw new AppError("An Error occured. Please try again", StatusCodes.INTERNAL_SERVER_ERROR) 

    return AppResponse(req, res, StatusCodes.OK, { message : "Station has been approved successfully", data :{ _id : updatedStation._id}})
  }
  

  async getBusStations(req: Request, res: Response) {
    const data: {
      stationId: string;
      dateFrom?: Date;
      dateTo?: Date;
      cursor?: string;
      town?: string;
      state?: string;
      country?: string;
      sort?: string;
      active : boolean;
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

    if (data?.active) {
      matchQuery.active = { $eq: data.active };
    }

  if(req.role in [ROLES.RIDER, ROLES.DRIVER]){
    matchQuery.active = { $eq: true };
  }

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

    const result = await this.busStation.findBusStations(query);

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

  async getBuStationById(req: Request, res: Response) {
    const stationId: string = req.params.id;

    const result = await this.busStation.getBusStationById(stationId);



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

  async updateBusStation(req: Request, res: Response) {
    const data: IBusStation & { stationId: string } = req.body;


    const { stationId, ...rest } = data;

    const updatedStation = await this.busStation.updateBusStation({
      docToUpdate: {_id :{ $eq : stationId}},
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
  async deleteBusStations(req: Request, res: Response) {
    const data: { busStationIds: string[] } = req.body;

    const { busStationIds } = data;

    if (busStationIds.length === 0)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const deletedBusStations = await this.busStation.deleteBusStations(
      busStationIds
    );

    return AppResponse(req, res, StatusCodes.OK, {
      message: `${deletedBusStations.deletedCount} bus stations deleted.`,
    });
  }
  

  async getBusStationStats(req : Request, res : Response){ 
    
    const data: {
      country?: string,
      state?: string,
      town?: string,

    } = req.body

    const matchQuery: MatchQuery = {
      // createdAt: { $gte: new Date(data.dateFrom), $lte: data?.dateTo ?? new Date(Date.now()) }
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

    const query = {
      pipeline: [
        // { $match: matchQuery },
        {
          $facet: {
            count: [{ $count: "total" }],
            getStationCountByStatus : [ 
             { 
              $group : {
                _id : "$status", 
                count : { $sum : 1 }
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

export const BusStation = new BusStationController(BusStationServiceLayer);

export default BusStation;
