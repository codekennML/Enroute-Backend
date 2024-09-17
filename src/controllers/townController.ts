import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import TownService, { TownServiceLayer } from "../services/townService";
import { Request, Response } from "express";
import { ITown } from "../model/interfaces";
import AppResponse from "../utils/helpers/AppResponse";
import { MatchQuery, SortQuery } from "../../types/types";
import { sortRequest } from "../utils/helpers/sortQuery";
import { Types } from "mongoose";

class TownController {
  private town: TownService;

  constructor(service: TownService) {
    this.town = service;
  }

  async createTown(req: Request, res: Response) {
    const data: ITown = req.body;

    const createdTown = await this.town.createTown(data);

    return AppResponse(req, res, StatusCodes.CREATED, {
      message: "Town created successfully",
      data: createdTown,
    });
  }

  autoCompleteTownName = async (req: Request, res: Response): Promise<void> => {

    const { townName } = req.query

    // Input validation
    if (!townName) {
      throw new AppError("No results matching this request was found.Please try again", StatusCodes.NOT_FOUND)
    }



    // if (!Types.ObjectId.isValid(countryId)) {
    //   res.status(400).json({ error: 'Invalid countryId format' });
    //   return;
    // }

    const towns = await this.town.aggregateTowns(
      {
        pipeline: [
          {
            $search: {
              index: "townAutocomplete", // Replace with your actual index name
              compound: {
                must: [
                  {
                    autocomplete: {
                      query: townName,
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
            $lookup: {
              from: "countries",
              localField: "country",
              foreignField: "_id",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    name: 1
                  }
                }
              ],
              as: "country"
            }
          },
          {
            $unwind: "$country"
          },
          {
            $lookup: {
              from: "states",
              localField: "state",
              foreignField: "_id",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    name: 1
                  }
                }
              ],
              as: "state"
            }
          },
          {
            $unwind: "$state"
          },
          {
            $project: {
              _id: 1,
              name: 1,
              state: "$state",
              country: "$country",
              town: {
                _id: "$_id",
                name: "$name"
              },
              coordinates: 1,
            }
          }
        ]
      }
    );

    if (towns.length === 0) {
      res.status(404).json({ message: 'No matching towns found' });
      return;
    }

    return AppResponse(req, res, StatusCodes.OK, {
      message: 'Towns retrieved successfully',
      data: towns
    })

  }

  async getTowns(req: Request, res: Response) {
    const data: {
      cursor: string;
      state: string;
      country: string;
      sort: string;
    } = req.body;

    const matchQuery: MatchQuery = {};

    if (data?.country) {
      matchQuery.country = { $eq: data?.country };
    }

    if (data?.state) {
      matchQuery.state = { $eq: data?.state };
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
      aggregatePipeline: [sortQuery, { $limit: 101 }],
      pagination: { pageSize: 100 },
    };

    const result = await this.town.findTowns(query);

    const hasData = result?.data?.length === 0;

    return AppResponse(
      req,
      res,
      hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
      {
        message: hasData
          ? `Towns retrieved retrieved succesfully`
          : `No towns were found for this request `,
        data: result,
      }
    );
  }

  async getTownById(req: Request, res: Response) {
    const townId: string = req.params.id;

    const result = await this.town.getTownById(townId);

    if (!result)
      throw new AppError(
        "No town was found for this request",
        StatusCodes.NOT_FOUND
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Town retrieved successfully",
      data: result,
    });
  }

  async updateTown(req: Request, res: Response) {
    const data: ITown & { townId: string } = req.body;


    const { townId, requiredDriverDocs, requiredRiderDocs, ...rest } = data;

    //This will overwrite the data 

    const updatedtown = await this.town.updateTown({
      docToUpdate: { _id: { $eq: townId } },
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

    if (!updatedtown)
      throw new AppError(
        "Error : Update to Town failed",
        StatusCodes.NOT_FOUND
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Town updated successfully",
      data: updatedtown,
    });
  }

  //Admins only
  async deleteTowns(req: Request, res: Response) {
    const data: { townIds: string[] } = req.body;

    const { townIds } = data;

    if (townIds.length === 0)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const deletedTowns = await this.town.deleteTowns(townIds);

    return AppResponse(req, res, StatusCodes.OK, {
      message: `${deletedTowns.deletedCount} Towns deleted.`,
    });
  }
}

export const Town = new TownController(TownServiceLayer);

export default Town;
