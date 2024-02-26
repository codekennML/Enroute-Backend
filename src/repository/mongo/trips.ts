import { Model, ClientSession } from "mongoose";
import { ITrip } from "../../model/interfaces";
import ITripModel, { Trips } from "../../model/trip";
import DBLayer, { PaginationRequestData, QueryData } from "./shared";

class TripRepository {
  private tripsDBLayer: DBLayer<ITripModel>;

  constructor(model: Model<ITripModel>) {
    this.tripsDBLayer = new DBLayer<ITripModel>(model);
  }

  async createTrip(
    request: ITrip,
    session?: ClientSession
  ): Promise<ITripModel[]> {
    let newTrip: ITripModel[] = [];

    try {
      newTrip = await this.tripsDBLayer.createDocs([request], session);
    } catch (error) {
      console.error(error);
    }

    return newTrip;
  }

  async findTrip(request: QueryData) {
    const trips = await this.tripsDBLayer.findDocs(request);

    return trips;
  }

  async returnPaginatedTrips(request: PaginationRequestData) {
    const paginatedUsers = await this.tripsDBLayer.paginateData(request);

    return paginatedUsers;
  }
}

export const tripsDataLayer = new TripRepository(Trips);

export default TripRepository;
