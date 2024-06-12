import Vehicle, { IVehicleModel } from "../model/vehicles";
import { ClientSession, Model } from "mongoose";
import DBLayer, {
  PaginationRequestData,
  QueryData,
  updateManyQuery,
} from "./shared";
import { IVehicle } from "../model/interfaces";

class VehicleRepository {
  private VehicleDBLayer: DBLayer<IVehicleModel>;

  constructor(model: Model<IVehicleModel>) {
    this.VehicleDBLayer = new DBLayer<IVehicleModel>(model);
  }

  async createVehicle(
    request: IVehicle,
    session?: ClientSession
  ): Promise<IVehicleModel[]> {
    let createdVehicles: IVehicleModel[] = [];

    createdVehicles = await this.VehicleDBLayer.createDocs([request], session);

    return createdVehicles;
  }

  async getVehicleById(request: QueryData) {
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

  async updateManyVehicles(request: updateManyQuery<IVehicleModel>) {
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
