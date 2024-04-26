import State from "../model/state";
import { ClientSession, Model } from "mongoose";
import DBLayer, {
  PaginationRequestData,
  QueryData,
  updateManyQuery,
} from "./shared";
import { IState } from "../model/interfaces";

class StateRepository {
  private stateDBLayer: DBLayer<IState>;

  constructor(model: Model<IState>) {
    this.stateDBLayer = new DBLayer<IState>(model);
  }

  async createState(
    request: IState,
    session?: ClientSession
  ): Promise<IState[]> {
    let createdStates: IState[] = [];

    createdStates = await this.stateDBLayer.createDocs([request], session);

    return createdStates;
  }

  async returnPaginatedStates(request: PaginationRequestData) {
    const paginatedStates = await this.stateDBLayer.paginateData(request);

    return paginatedStates;
  }

  async findStateById(request: QueryData) {
    const State = await this.stateDBLayer.findDocById(request);
    return State;
  }

  async updateState(request: {
    docToUpdate: { [key: string]: Record<"$eq", string> };
    updateData: { [k: string]: string | object | boolean };
    options: {
      new?: boolean;
      session?: ClientSession;
      select?: string;
      upsert?: boolean;
      includeResultMetadata?: boolean;
    };
  }) {
    const updatedState = await this.stateDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedState;
  }

  async updateManyCountries(request: updateManyQuery<IState>) {
    const result = await this.stateDBLayer.updateManyDocs(request);

    return result;
  }

  async bulkUpdateCountries(request: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    operations: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any;
  }) {
    const result = await this.stateDBLayer.bulkWriteDocs(request);

    return result;
  }

  async deleteStates(request: string[]) {
    return this.stateDBLayer.deleteDocs(request);
  }
}

export const StateDataLayer = new StateRepository(State);

export default StateRepository;
