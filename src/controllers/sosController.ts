import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import SOSService, {
  SOSServiceLayer,
} from "../services/sosService";
import { Request, Response } from "express";
import { ISOS } from "../model/interfaces";
import AppResponse from "../utils/helpers/AppResponse";
import { MatchQuery, SortQuery } from "../../types/types";
import { sortRequest } from "../utils/helpers/sortQuery";


class SOSController {
  private SOS: SOSService;

  constructor(service: SOSService) {
    this.SOS = service;
  }

  async createSOS(req: Request, res: Response) {

    const data: ISOS = req.body;

    const createdSOS = await this.SOS.createSOS(data);

    return AppResponse(req, res, StatusCodes.CREATED, {
      message: "SOS created successfully",
      data: createdSOS,
    });
  }


  async getSOS(req: Request, res: Response) {
    const data: {
      SOSId: string;
      dateFrom?: Date;
      dateTo?: Date;
      cursor?: string;
      town?: string;
      state?: string;
      country?: string;
      sort?: string;
      
    } = req.body;

    const matchQuery: MatchQuery = {};

    if (data?.SOSId) {
      matchQuery._id = { $eq: data?.SOSId };
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

    const result = await this.SOS.findSOS(query);

    const hasData = result?.data?.length && result?.data?.length  > 0;

    return AppResponse(
      req,
      res,
      hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
      {
        message: hasData
          ? `SOS retrieved succesfully`
          : `No SOSs were found for this request `,
        data: result,
      }
    );
  }

  async getSOSById(req: Request, res: Response) {

    const SOSId: string = req.params.id;

    const result = await this.SOS.getSOSById(SOSId);

    if (!result)
      throw new AppError(
        "No SOS was found for this request",
        StatusCodes.NOT_FOUND
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: "SOS retrieved successfully",
      data: result,
    });
  }

  // async updateSOS(req: Request, res: Response) {
  //   const data: ISOS & { SOSId: string } = req.body;


  //   const { SOSId, ...rest } = data;

  //   const updatedSOS = await this.SOS.updateSOS({
  //     docToUpdate: {_id :{ $eq : SOSId}},
  //     updateData: {
  //       $set: {
  //         ...rest,
  //       },
  //     },
  //     options: {
  //       new: true,
  //       select: "_id",
  //     },
  //   });

  //   if (!updatedSOS)
  //     throw new AppError(
  //       "Error : Update to SOS failed",
  //       StatusCodes.NOT_FOUND
  //     );



  //   return AppResponse(req, res, StatusCodes.OK, {
  //     message: "SOS updated successfully",
  //     data: updatedSOS,
  //   });
  // }

  //Admins only
  async deleteSOS(req: Request, res: Response) {
    const data: { SOSIds: string[] } = req.body;

    const { SOSIds } = data;

    if (SOSIds.length === 0)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const deletedSOSs = await this.SOS.deleteSOS(
      SOSIds
    );

    return AppResponse(req, res, StatusCodes.OK, {
      message: `${deletedSOSs.deletedCount} SOSs deleted.`,
    });
  }
  

  async getSOSStats(req : Request, res : Response){ 
    
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
        { $match: matchQuery },
        {
          $facet: {
            count: [{ $count: "total" }],
     
         
          }
        }
      ]
    };


    const result = await this.SOS.aggregateSOS(query)

    return AppResponse(req, res, StatusCodes.OK, result)
   
  }

}

export const SOS = new SOSController(SOSServiceLayer);

export default SOS;
