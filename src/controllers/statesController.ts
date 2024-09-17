import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import StateService, { StateServiceLayer } from "../services/stateService";
import { Request, Response } from "express";
import { IState } from "../model/interfaces";
import AppResponse from "../utils/helpers/AppResponse";
import { MatchQuery, SortQuery } from "../../types/types";
import { sortRequest } from "../utils/helpers/sortQuery";
import { PipelineStage, Types } from "mongoose";
import { ROLES } from "../config/enums";

class StateController {
  private state: StateService;

  constructor(service: StateService) {
    this.state = service;
  }

  createState = async (req: Request, res: Response) => {
    const data: IState = req.body;

    const createdState = await this.state.createState(data);

    return AppResponse(req, res, StatusCodes.CREATED, {
      message: "State created successfully",
      data: createdState,
    });
  }

  autoCompleteStateName = async (req: Request, res: Response): Promise<void> => {

    const { countryId, stateName } = req.query;

    console.log(countryId, stateName, "Mertte")
    // Input validation
    if (!countryId || !stateName) {
      throw new AppError("No results matching this request was found.Please try again", StatusCodes.NOT_FOUND)
    }

    const text = new Types.ObjectId(countryId as string)
    console.log(text)
    const states = await this.state.aggregateStates(
      {
        pipeline: [
          {
            $search: {
              index: "states",
              compound: {
                must: [
                  {
                    autocomplete: {
                      query: stateName,
                      tokenOrder: "sequential",
                      path: "name",
                      fuzzy: {
                        maxEdits: 1,
                        prefixLength: 1
                      }
                    }
                  }
                ],
                filter: [
                  {
                    equals: {
                      path: "country",
                      value: text
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
            $project: {
              _id: 1,
              name: 1,
              coordinates: "$location.coordinates",
              country: "$country",
              state: {
                _id: "$_id",
                name: "$name"
              }
            }
          }
        ]
      }
    );

    if (states.length === 0) {
      res.status(404).json({ message: 'No matching states found' });
      return;
    }

    return AppResponse(req, res, StatusCodes.OK, {
      message: 'States retrieved successfully',
      data: states
    })


  }

  getStates = async (req: Request, res: Response) => {
    const data: {
      cursor: string;
      country: string;
      sort: string;
    } = req.body;

    const matchQuery: MatchQuery = {};

    if (data?.country) {
      matchQuery.country = { $eq: data.country };
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

    const result = await this.state.findStates(query);

    const hasData = result?.data?.length === 0;

    return AppResponse(
      req,
      res,
      hasData ? StatusCodes.NOT_FOUND : StatusCodes.OK,
      {
        message: hasData
          ? `No States were found for this request `
          : `States retrieved succesfully`
        ,
        data: result,
      }
    );
  }

  getStateRequiredDocs = async (req: Request, res: Response) => {

    const { id: stateId, serviceType, userRole } = req.query


    const role = req.role || parseInt(userRole as string)

    console.log(role)

    if (!stateId || (role === ROLES.DRIVER && !serviceType)) throw new AppError(getReasonPhrase(StatusCodes.BAD_REQUEST), StatusCodes.BAD_REQUEST)

    console.log(stateId, "stateId")
    const query = { _id: new Types.ObjectId(stateId as string) }


    const projection: PipelineStage = {
      $project: {
        _id: 1,

      }
    }

    const finalProjection: PipelineStage = {
      $project: {
        _id: 1,
      }
    }


    if (role === ROLES.DRIVER) {

      let vehicleType = "car"

      if (serviceType === "haulage") {
        vehicleType = "truck"
      }

      if (serviceType === "dispatch") {
        vehicleType = "bike"
      }

      projection.$project["requiredDriverDocs"] = 1

      //This takes the vehicle required docs from the country docs 
      projection.$project["vehicleRequiredDocs"] = `$vehicleRequiredDocs.${vehicleType}`

      projection.$project["serviceDocs"] = `$serviceRequiredDocs.${serviceType}`

      //Final projection 
      finalProjection.$project["areaRequiredDocs"] = "$country.requiredDriverDocs"
      //We do not want to limit our selves to a state or country so we request the minimal data and provide services anonymously with the basic requirements needed for verification
      // { $concatArrays: ["$country.requiredDriverDocs", "$requiredDriverDocs"] }

      finalProjection.$project["vehicleDocs"] = "$country.vehicleRequiredDocs"

      // {
      //   $concatArrays: ["$country.vehicleRequiredDocs", `$vehicleRequiredDocs.${vehicleType}`]
      // }

      finalProjection.$project["serviceDocs"] = "$country.serviceDocs"
      // { $concatArrays: ["$country.serviceDocs", `$serviceRequiredDocs.${serviceType}`] }
    }

    if (role === ROLES.RIDER) {
      projection.$project["requiredRiderDocs"] = 1
      // projection.$project["stateRequiredDocs"] = 1

      //Final projection 
      finalProjection.$project["areaRequiredDocs"] = {
        $concatArrays: [
          { $ifNull: ["$country.requiredRiderDocs", []] }, // If undefined, fallback to an empty array
          { $ifNull: ["$requiredRiderDocs", []] } // If undefined, fallback to an empty array
        ]
      }

    }

    const docsQuery = [
      {
        $match: query
      },

      {
        $lookup: {
          from: "countries",
          localField: 'country',
          foreignField: "_id",
          pipeline: [
            projection
          ],
          as: "country"
        }
      },
      {
        $unwind: "$country"
      },
      finalProjection

    ]

    console.log(JSON.stringify(docsQuery), "qiery")


    const result = await this.state.aggregateStates({
      pipeline: docsQuery
    })

    console.log(result, "Data")
    if (!result)
      throw new AppError(
        "No State was found for this request",
        StatusCodes.NOT_FOUND
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: "State required docs retrieved successfully",
      data: result
    });
  }

  getStateById = async (req: Request, res: Response) => {

    const stateId: string = req.params.id;

    const result = await this.state.getStateById(stateId);

    if (!result)
      throw new AppError(
        "No State was found for this request",
        StatusCodes.NOT_FOUND
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: "State retrieved successfully",
      data: result,
    });
  }

  updateState = async (req: Request, res: Response) => {
    const data: IState & { stateId: string } = req.body;

    const { stateId, ...rest } = data;

    const updatedstate = await this.state.updateState({
      docToUpdate: { _id: { $eq: stateId } },
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

    if (!updatedstate)
      throw new AppError(
        "Error : Update to State failed",
        StatusCodes.NOT_FOUND
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: "State updated successfully",
      data: updatedstate,
    });
  }

  deleteStates = async (req: Request, res: Response) => {
    const data: { stateIds: string[] } = req.body;

    const { stateIds } = data;

    if (stateIds.length === 0)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const deletedStates = await this.state.deleteStates(stateIds);

    return AppResponse(req, res, StatusCodes.OK, {
      message: `${deletedStates.deletedCount} states deleted.`,
    });
  }
}

export const State = new StateController(StateServiceLayer);

export default State;
