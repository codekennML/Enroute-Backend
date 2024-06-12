import { Model, ClientSession } from "mongoose";
import { ITrip } from "../model/interfaces";
import Trips from "../model/trip";
import DBLayer, {
  AggregateData,
  PaginationRequestData,
  QueryData,
  updateManyQuery,
} from "./shared";

class TripRepository {
  private tripsDBLayer: DBLayer<ITrip>;

  constructor(model: Model<ITrip>) {
    this.tripsDBLayer = new DBLayer<ITrip>(model);
  }

  async createTrip(request: ITrip, session?: ClientSession): Promise<ITrip[]> {
    let newTrip: ITrip[] = [];

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
  async findTripById(request: QueryData) {
    const trip = await this.tripsDBLayer.findDocById(request);
    return trip;
  }

  async updateManyTrips(request: updateManyQuery<ITrip>) {
    const result = await this.tripsDBLayer.updateManyDocs(request);

    return result;
  }

  async updateTrip(request: {
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
