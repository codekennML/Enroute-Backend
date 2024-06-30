import { Model, ClientSession } from "mongoose";
import { ITrip } from "../model/interfaces";
import Trips from "../model/trip";
import DBLayer, {
  AggregateData,
  PaginationRequestData,
  QueryData,
  QueryId,
  updateManyQuery,
} from "./shared";
import { UpdateRequestData } from "../../types/types";

class TripRepository {
  private tripsDBLayer: DBLayer<ITrip>;

  constructor(model: Model<ITrip>) {
    this.tripsDBLayer = new DBLayer<ITrip>(model);
  }

  async createTrip(request: ITrip, session?: ClientSession) {
   


  const newTrip = await this.tripsDBLayer.createDocs([request], session);
 

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
  async findTripById(request: QueryId) {

    const trip = await this.tripsDBLayer.findDocById(request);
    return trip;
  }

  async updateManyTrips(request: updateManyQuery<ITrip>) {
    const result = await this.tripsDBLayer.updateManyDocs(request);

    return result;
  }

  async updateTrip(request: UpdateRequestData) {
    const updatedTrip = await this.tripsDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedTrip;
  }

  async deleteTrips(request: string[]) {
    return this.tripsDBLayer.deleteDocs(request);
  }

  async getPopulatedTrip(request: QueryData) {
    return this.tripsDBLayer.findDocs(request);
  }

  async aggregateData(request: AggregateData) {
    return await this.tripsDBLayer.aggregateData(request)
  }

}

export const tripsDataLayer = new TripRepository(Trips);

export default TripRepository;
