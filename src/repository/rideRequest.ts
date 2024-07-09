import RideRequestModel, { RideRequest } from "../model/rideRequest";
import { ClientSession, Model, PipelineStage } from "mongoose";
import DBLayer, {
  PaginationRequestData,
  QueryId,
  updateManyQuery,
} from "./shared";
import { IRideRequest } from "../model/interfaces";
import { UpdateRequestData } from "../../types/types";

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

  async getRideRequestById(request: QueryId) {
    const rideRequest = await this.rideRequestDBLayer.findDocById(request);
    return rideRequest;
  }

  async updateRideRequest(request: UpdateRequestData) {
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

  async aggregateRideRequests(request: PipelineStage[], session? : ClientSession) {
    return await this.rideRequestDBLayer.aggregateDocs(request, session);
  }

  async deleteRideRequests(request: string[]) {
    return this.rideRequestDBLayer.deleteDocs(request);
  }
}

export const RideRequestDataLayer = new RideRequestRepository(RideRequest);

export default RideRequestRepository;
