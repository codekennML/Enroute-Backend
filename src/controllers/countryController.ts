import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import CountryService, {
  CountryServiceLayer,
} from "../services/countryService";
import { Request, Response } from "express";
import { ICountry } from "../model/interfaces";
import AppResponse from "../utils/helpers/AppResponse";
import { MatchQuery, SortQuery } from "../../types/types";
import { sortRequest } from "../utils/helpers/sortQuery";
import { Types } from "mongoose";

class CountryController {
  private country: CountryService;

  constructor(service: CountryService) {
    this.country = service;
  }

  async createCountry(req: Request, res: Response) {

    const data: ICountry = req.body;

    const createdCountry = await this.country.createCountry(data);

    return AppResponse(req, res, StatusCodes.CREATED, {
      message: "Country created successfully",
      data: createdCountry,
    });
  }

  async getCountries(req: Request, res: Response) {
    const data: {
      countryId: string;
      cursor?: string;
      sort?: string;
      name? : string
    } = req.body;

    const matchQuery: MatchQuery = {};

    const sortQuery: SortQuery = sortRequest(data?.sort);
    if(data?.countryId) {
      matchQuery._id  =  { _$eq : data.countryId }
    }

    if(data?.name) {
      matchQuery.name  =  { _$eq : data.name }
    }

    if (data?.cursor) {
      const orderValue = Object.values(sortQuery)[0] as unknown as number;

      const order =
        orderValue === 1 ? { $gt: data.cursor } : { $lt: data?.cursor };

      matchQuery._id = order;
    }

    const query = {
      query: matchQuery,
      aggregatePipeline: [sortQuery, { $limit: 101 }],
      pagination: { pageSize: 100 },
    };

    const result = await this.country.findCountries(query);

    const hasData = result?.data?.length === 0;

    return AppResponse(
      req,
      res,
      hasData ? StatusCodes.NOT_FOUND :  StatusCodes.OK ,
      {
        message: hasData
        ? `No countries were found for this request `
          : `Countries retrieved retrieved succesfully`
           ,
        data: result,
      }
    );
  }

  

  async getCountryById(req: Request, res: Response) {

    const countryId: string = req.params.id;

    const result = await this.country.getCountryById(countryId);

    if (!result)
      throw new AppError(
        "No country was found for this request",
        StatusCodes.NOT_FOUND
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: "country retrieved successfully",
      data: result,
    });
  }

  async updateCountry(req: Request, res: Response) {
    const data: ICountry & { countryId: string } = req.body;

    const { countryId, requiredDriverDocs, requiredRiderDocs,  ...rest } = data; 

    const updatedcountry = await this.country.updateCountry({
      docToUpdate: { _id : { $eq : new Types.ObjectId(countryId)}},
      updateData: {
        $set: {
       ...rest,
        },
        $addToSet : { requiredDriverDocs,  requiredRiderDocs}
      },
      options: {
        new: true,
        select: "_id placeId",
      },
    });

    if (!updatedcountry)
      throw new AppError(
        "Error : Update to country failed",
        StatusCodes.NOT_FOUND
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Country updated successfully",
      data: updatedcountry,
    });
  }

  async deleteCountries(req: Request, res: Response) {
    const data: { countryIds: string[] } = req.body;

    const { countryIds } = data;

    if (countryIds.length === 0)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const deletedCountries = await this.country.deleteCountries(countryIds);

    return AppResponse(req, res, StatusCodes.OK, {
      message: `${deletedCountries.deletedCount} countries deleted.`,
    });
  }
}

export const Country = new CountryController(CountryServiceLayer);

export default Country;
