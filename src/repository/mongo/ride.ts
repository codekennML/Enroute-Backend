import { Model, ClientSession } from "mongoose";
import { IRide } from "../../model/interfaces";
import IRideModel, { Ride } from "../../model/rides";
import DBLayer, { PaginationRequestData, QueryData } from "./shared";
import { UpdateRequestData } from "../../../types/types";

class RideRepository {
  private ridesDBLayer: DBLayer<IRideModel>;

  constructor(model: Model<IRideModel>) {
    this.ridesDBLayer = new DBLayer<IRideModel>(model);
  }

  async createRide(
    request: IRide,
    session?: ClientSession
  ): Promise<IRideModel[]> {
    let newRide: IRideModel[] = [];

    try {
      newRide = await this.ridesDBLayer.createDocs([request], session);
    } catch (error) {
      console.error(error);
    }

    return newRide;
  }

  async findRide(request: QueryData) {
    const rides = await this.ridesDBLayer.findDocs(request);

    return rides;
  }

  async returnPaginatedRides(request: PaginationRequestData) {
    const paginatedUsers = await this.ridesDBLayer.paginateData(request);

    return paginatedUsers;
  }

  async updateRides(request: UpdateRequestData) {
    const updatedDocs = await this.ridesDBLayer.updateDoc(request);

    return updatedDocs;
  }
}

export const ridesDataLayer = new RideRepository(Ride);

export default RideRepository;
