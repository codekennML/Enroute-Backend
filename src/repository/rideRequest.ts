import RideRequestModel, { RideRequest } from "../model/rideRequest";
import { ClientSession, Model, PipelineStage } from "mongoose";
import DBLayer, {
  PaginationRequestData,
  QueryData,
  updateManyQuery,
} from "./shared";
import { IRideRequest } from "../model/interfaces";

class RideRequestRepository {
  private rideRequestDBLayer: DBLayer<RideRequestModel>;

  constructor(model: Model<RideRequestModel>) {
    this.rideRequestDBLayer = new DBLayer<RideRequestModel>(model);
  }

  async createRideRequest(
    request: IRideRequest,
    session?: ClientSession
  ): Promise<RideRequestModel[]> {
    let createdRideRequests: RideRequestModel[] = [];

    createdRideRequests = await this.rideRequestDBLayer.createDocs(
      [request],
      session
    );

    return createdRideRequests;
  }

  async returnPaginatedRideRequests(request: PaginationRequestData) {
    const paginatedRideRequests = await this.rideRequestDBLayer.paginateData(
      request
    );

    return paginatedRideRequests;
  }

  async getRideRequestById(request: QueryData) {
    const rideRequest = await this.rideRequestDBLayer.findDocById(request);
    return rideRequest;
  }

  async updateRideRequest(request: {
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
    const updatedRideRequest = await this.rideRequestDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedRideRequest;
  }

  async updateManyRideRequests(request: updateManyQuery<RideRequestModel>) {
    const result = await this.rideRequestDBLayer.updateManyDocs(request);

    return result;
  }

  async aggregateRideRequests(request: PipelineStage[]) {
    return await this.rideRequestDBLayer.aggregateDocs(request);
  }

  async deleteRideRequests(request: string[]) {
    return this.rideRequestDBLayer.deleteDocs(request);
  }
}

export const RideRequestDataLayer = new RideRequestRepository(RideRequest);

export default RideRequestRepository;
