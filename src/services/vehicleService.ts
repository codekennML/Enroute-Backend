import { PopulateOptions, ClientSession } from "mongoose";
import { IVehicle } from "../model/interfaces";
import VehicleRepository, { VehicleDataLayer } from "../repository/vehicles";
import { UpdateRequestData } from "../../types/types";
import Documents from "../model/documents";
import { PaginationRequestData, QueryData } from "../repository/shared";

class VehicleService {
  private vehicle: VehicleRepository;

  constructor(service: VehicleRepository) {
    this.vehicle = service;
  }

  async createVehicle(
    request: Omit<IVehicle, "isRejected" | "isVerified" | "isArchived">
  ) {
    const { ...rest } = request;
    //We are extracting those fields to ensure the user does not send them and is approved

    const createdVehicle = await this.vehicle.createVehicle({
      ...rest,
      isVerified: false,
      isArchived: false,
    });

    return createdVehicle; //tThis should return an array of one vehicle only
  }

  async updateVehicle(request: UpdateRequestData) {
    const updatedVehicle = await this.vehicle.updateVehicle(request);
    return updatedVehicle;
  }

  async getVehicles(request: PaginationRequestData) {
    return this.vehicle.returnPaginatedVehicles(request);
  }

  async findVehicles(request : QueryData){
    return await this.vehicle.getVehicles(request)
  }

  async getVehicleById(
    vehicleId: string,
    select: string,
    session?: ClientSession
  ) {
    //always include the adddress
    const populateQuery: PopulateOptions[] = [
      {
        path: "insurance",
        model: Documents,
      },
      {
        path: "inspection",
        model: Documents,
      },
    ];

    const vehicle = await this.vehicle.getVehicleById({
      query: { id: vehicleId },
      session,
      populatedQuery: populateQuery,
      select,
    });

    return vehicle;
  }

  async deleteVehicles(request: string[]) {
    const deletedVehicles = await this.vehicle.deleteVehicles(request);

    return deletedVehicles;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async bulkWriteVehicles(request: any, session: ClientSession) {
    const { operations } = request;
    const result = await this.vehicle.bulkWriteVehicles({
      operations,
      options: { session },
    });

    return result;
  }
}

export const VehicleServiceLayer = new VehicleService(VehicleDataLayer);

export default VehicleService;
