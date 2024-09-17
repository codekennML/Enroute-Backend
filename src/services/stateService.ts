import { AggregateData, PaginationRequestData } from "./../repository/shared";
import { ClientSession, Types } from "mongoose";
import { IState } from "../model/interfaces";
import StateRepository, { StateDataLayer } from "../repository/state";
import { UpdateRequestData } from "../../types/types";

class StateService {
  private State: StateRepository;

  constructor(service: StateRepository) {
    this.State = service;
  }

  async createState(request: IState) {
    const State = await this.State.createState(request);

    return State; //tThis should return an array of one State only
  }

  async findStates(request: PaginationRequestData) {
    return this.State.returnPaginatedStates(request);
  }

  async updateState(request: UpdateRequestData) {
    const updatedState = await this.State.updateState(request);
    return updatedState;
  }

  async getStateById(
    stateId: string,
    select?: string,
    session?: ClientSession
  ) {
    const State = await this.State.findStateById({
      query: new Types.ObjectId(stateId),
      select,
      session,
    });

    return State;
  }

  async deleteStates(request: string[]) {
    const deletedStates = await this.State.deleteStates(request);
    return deletedStates;
  }

  async aggregateStates(request: AggregateData) {
    return await this.State.aggregateStates(request)
  }
}

export const StateServiceLayer = new StateService(StateDataLayer);

export default StateService;
