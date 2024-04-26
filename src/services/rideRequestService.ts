import { PaginationRequestData } from "./../repository/shared";
import { ClientSession, PipelineStage } from "mongoose";
import { IRideRequest } from "../model/interfaces";
import RideRequestRepository, {
  RideRequestDataLayer,
} from "../repository/rideRequest";
import { UpdateRequestData } from "../../types/types";

class RideRequestService {
  private rideRequest: RideRequestRepository;

  constructor(service: RideRequestRepository) {
    this.rideRequest = service;
  }

  async createRideRequest(request: IRideRequest, session?: ClientSession) {
    const rideRequest = await this.rideRequest.createRideRequest(
      request,
      session
    );

    return rideRequest; //tThis should return an array of one RideRequest only
  }

  async findRideRequests(request: PaginationRequestData) {
    return this.rideRequest.returnPaginatedRideRequests(request);
  }

  async updateRideRequest(request: UpdateRequestData) {
    const updatedRideRequest = await this.rideRequest.updateRideRequest(
      request
    );
    return updatedRideRequest;
  }

  async getRideRequestById(
    RideRequestId: string,
    select?: string,
    session?: ClientSession
  ) {
    const RideRequest = await this.rideRequest.getRideRequestById({
      query: { id: RideRequestId },
      select,
      session,
    });

    return RideRequest;
  }

  async aggregateRideRequests(request: PipelineStage[]) {
    return await this.rideRequest.aggregateRideRequests(request);
  }

  async deleteRideRequests(request: string[]) {
    const deletedRequests = await this.rideRequest.deleteRideRequests(request);
    return deletedRequests;
  }
}

export const RideRequestServiceLayer = new RideRequestService(
  RideRequestDataLayer
);

export default RideRequestService;
