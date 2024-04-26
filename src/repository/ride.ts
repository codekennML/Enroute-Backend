import { Model, ClientSession } from "mongoose";
import { IRide } from "../model/interfaces";
import { Ride } from "../model/rides";
import DBLayer, { PaginationRequestData, updateManyQuery } from "./shared";
import { UpdateRequestData } from "../../types/types";

class RideRepository {
  private ridesDBLayer: DBLayer<IRide>;

  constructor(model: Model<IRide>) {
    this.ridesDBLayer = new DBLayer<IRide>(model);
  }

  async createRide(request: IRide, session?: ClientSession): Promise<IRide[]> {
    let newRide: IRide[] = [];

    try {
      newRide = await this.ridesDBLayer.createDocs([request], session);
    } catch (error) {
      console.error(error);
    }

    return newRide;
  }

  async returnPaginatedRides(request: PaginationRequestData) {
    const paginatedUsers = await this.ridesDBLayer.paginateData(request);

    return paginatedUsers;
  }

  async updateRides(request: UpdateRequestData) {
    const updatedDocs = await this.ridesDBLayer.updateDoc(request);

    return updatedDocs;
  }

  async updateManyRides(request: updateManyQuery<IRide>) {
    const result = await this.ridesDBLayer.updateManyDocs(request);

    return result;
  }
}

export const ridesDataLayer = new RideRepository(Ride);

export default RideRepository;
