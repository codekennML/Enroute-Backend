import { AggregateData, PaginationRequestData, updateManyQuery } from "./../repository/shared";
import { ClientSession, Types } from "mongoose";
import { IRide } from "../model/interfaces";
import RideRepository, { ridesDataLayer } from "../repository/ride";
import { UpdateRequestData } from "../../types/types";


class RideService {
  private Ride: RideRepository;

  constructor(repository: RideRepository) {
    this.Ride = repository;
  }

  async createRide(request: IRide) {
    const Ride = await this.Ride.createRide(request);

    return Ride; //tThis should return an array of one Ride only
  }

  async findRides(request: PaginationRequestData) {
    return this.Ride.returnPaginatedRides(request);
  }





  async updateRide(request: UpdateRequestData) {
    const updatedRide = await this.Ride.updateRides(request);
    return updatedRide;
  }

  async getRideById(rideId: string, select?: string, session?: ClientSession) {
    const Ride = await this.Ride.getRideById({
      query: new Types.ObjectId(rideId),
      select,
      session,
    });

    return Ride;
  }

  async updateManyRides(request: updateManyQuery<IRide>) {
    return await this.Ride.updateManyRides(request)
  }

  async deleteRides(request: string[]) {
    const deletedRides = await this.Ride.deleteRides(request);

    return deletedRides;
  }
//This runs any aggregate pipeline 
  async aggregateRides(request: AggregateData) {
    return await this.Ride.aggregateData(request)
  }
}

export const RideServiceLayer = new RideService(ridesDataLayer);

export default RideService;
