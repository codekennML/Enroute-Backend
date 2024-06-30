import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import StateService, { StateServiceLayer } from "../services/stateService";
import { Request, Response } from "express";
import { IState } from "../model/interfaces";
import AppResponse from "../utils/helpers/AppResponse";
import { MatchQuery, SortQuery } from "../../types/types";
import { sortRequest } from "../utils/helpers/sortQuery";

class StateController {
  private state: StateService;

  constructor(service: StateService) {
    this.state = service;
  }

  async createState(req: Request, res: Response) {
    const data: IState = req.body;

    const createdState = await this.state.createState(data);

    return AppResponse(req, res, StatusCodes.CREATED, {
      message: "State created successfully",
      data: createdState,
    });
  }

  async getStates(req: Request, res: Response) {
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

    const hasData = result?.data?.length > 0;

    return AppResponse(
      req,
      res,
      hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
      {
        message: hasData
          ? `States retrieved succesfully`
          : `No States were found for this request `,
        data: result,
      }
    );
  }

  async getStateById(req: Request, res: Response) {
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

  async updateState(req: Request, res: Response) {
    const data: IState & { stateId: string } = req.body;

    const { stateId, ...rest } = data;

    const updatedstate = await this.state.updateState({
      docToUpdate: stateId,
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

  async deleteStates(req: Request, res: Response) {
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
