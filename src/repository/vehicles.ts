import Vehicle from "../model/vehicles";
import { ClientSession, Model } from "mongoose";
import DBLayer, {
  PaginationRequestData,
  QueryData,
  QueryId,
  updateManyQuery,
} from "./shared";
import { IVehicle } from "../model/interfaces";
import { UpdateRequestData } from "../../types/types";

class VehicleRepository {
  private VehicleDBLayer: DBLayer<IVehicle>;

  constructor(model: Model<IVehicle>) {
    this.VehicleDBLayer = new DBLayer<IVehicle>(model);
  }

  async createVehicle(
    request: IVehicle,
    session?: ClientSession
  ) {
  

  const  createdVehicles = await this.VehicleDBLayer.createDocs([request], session);

    return createdVehicles;
  }

  async getVehicleById(request: QueryId) {
    const vehicle = await this.VehicleDBLayer.findDocById(request);

    return vehicle;
  }

  async returnPaginatedVehicles(request: PaginationRequestData) {
    const paginatedVehicles = await this.VehicleDBLayer.paginateData(request);

    return paginatedVehicles;
  }
  async getVehicles(request : QueryData){ 
    const vehicles = await this.VehicleDBLayer.findDocs(request);

    return vehicles;
  }

  async updateVehicle(request: UpdateRequestData) {
    const updatedVehicle = await this.VehicleDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedVehicle;
  }

  async updateManyVehicles(request: updateManyQuery<IVehicle>) {
    const result = await this.VehicleDBLayer.updateManyDocs(request);

    return result;
  }

  async deleteVehicles(request: string[]) {
    return this.VehicleDBLayer.deleteDocs(request);
  }

  async bulkWriteVehicles(request: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    operations: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any;
  }) {
    const result = await this.VehicleDBLayer.bulkWriteDocs(request);

    return result;
  }
}

export const VehicleDataLayer = new VehicleRepository(Vehicle);

export default VehicleRepository;
