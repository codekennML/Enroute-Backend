import { PaginationRequestData } from "./../repository/shared";
import { ClientSession } from "mongoose";
import { ITrip } from "../model/interfaces";
import TripsRepository, { tripsDataLayer } from "../repository/trips";
import { UpdateRequestData } from "../../types/types";

class TripsService {
  private trips: TripsRepository;

  constructor(service: TripsRepository) {
    this.trips = service;
  }

  async createTrips(request: ITrip) {
    const Trips = await this.trips.createTrip(request);

    return Trips; //tThis should return an array of one Trips only
  }

  async findTripss(request: PaginationRequestData) {
    return this.trips.returnPaginatedTrips(request);
  }

  async updateTrips(request: UpdateRequestData) {
    const updatedTrips = await this.trips.updateTrip(request);
    return updatedTrips;
  }

  async getTripsById(
    TripsId: string,
    select?: string,
    session?: ClientSession
  ) {
    const Trips = await this.trips.findTripById({
      query: { id: TripsId },
      select,
      session,
    });

    return Trips;
  }

  async deleteTripss(request: string[]) {
    const deletedTrips = await this.trips.deleteTrips(request);

    return deletedTrips;
  }
}

export const TripsServiceLayer = new TripsService(tripsDataLayer);

export default TripsService;
