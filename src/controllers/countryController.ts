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


  getCountries = async (req: Request, res: Response) => {

    interface QueryParams {
      callingCode?: string,
      shortCode?: string
      countryId: string;
      cursor?: string;
      sort?: string;
      name?: string
      limit?: number
    }

    const data = req.query as unknown as QueryParams

    const matchQuery: MatchQuery = {};

    const limit = data?.limit

    const sortQuery: SortQuery = sortRequest(data?.sort);
    if (data?.countryId) {
      matchQuery._id = { $eq: data.countryId }
    }

    if (data?.shortCode) {
      matchQuery.isoCode = { $eq: data.shortCode }
    }

    if (data?.callingCode) {
      matchQuery.code = { $eq: parseInt(data.callingCode) }
    }

    if (data?.name) {
      matchQuery.name = { $eq: data.name }
    }

    if (data?.cursor) {
      const orderValue = Object.values(sortQuery)[0] as unknown as number;

      const order =
        orderValue === 1 ? { $gt: data.cursor } : { $lt: data?.cursor };

      matchQuery._id = order;
    }


    const aggregatePipeline = [
      sortQuery,
      { $limit: limit || 101 },
      {
        $project: {
          requiredDriverDocs: 0,
          requiredRiderDocs: 0
        }
      }
    ]

    if (limit) {
      aggregatePipeline.splice(1, 1)
    }

    const query = {
      query: matchQuery,
      aggregatePipeline,
      pagination: { pageSize: limit ? limit : 100 }


    };


    console.log(query)
    const result = await this.country.findCountries(query);

    const hasData = result?.data?.length === 0;

    return AppResponse(
      req,
      res,
      hasData ? StatusCodes.NOT_FOUND : StatusCodes.OK,
      {
        message: hasData
          ? `No countries were found for this request `
          : `Countries retrieved succesfully`
        ,
        ...result
      }
    );
  }


  autoCompleteCountries = async (req: Request, res: Response) => {
    const { countryName } = req.query

    // Input validation
    if (!countryName) {
      throw new AppError("No results matching this request was found.Please try again", StatusCodes.NOT_FOUND)
    }

    const countries = await this.country.aggregateCountries(
      {
        pipeline: [
          {
            $search: {
              index: "countryAutocomplete", // Replace with your actual index name
              compound: {
                must: [
                  {
                    autocomplete: {
                      query: countryName,
                      path: "name",
                      fuzzy: {
                        maxEdits: 1,
                        prefixLength: 1
                      }
                    }
                  }
                ]
              }
            }
          },
          {
            $limit: 5
          },

          {
            $project: {
              _id: 1,
              name: 1,
              coordinates: 1,
            }
          }
        ]
      }
    );

    if (countries.length === 0) {
      res.status(404).json({ message: 'No matching country found' });
      return;
    }

    return AppResponse(req, res, StatusCodes.OK, {
      message: 'Countries retrieved successfully',
      data: countries
    })
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

    const { countryId, requiredDriverDocs, requiredRiderDocs, ...rest } = data;

    const updatedcountry = await this.country.updateCountry({
      docToUpdate: { _id: { $eq: new Types.ObjectId(countryId) } },
      updateData: {
        $set: {
          ...rest,
        },
        $addToSet: { requiredDriverDocs, requiredRiderDocs }
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
