import BusStation from "../model/busStation";
import { ClientSession, Model } from "mongoose";
import DBLayer, {
  AggregateData,
  PaginationRequestData,
  QueryData,
  QueryId,
  updateManyQuery,
} from "./shared";
import { IBusStation } from "../model/interfaces";
import { UpdateRequestData } from "../../types/types";

class BusStationRepository {
  private busStationDBLayer: DBLayer<IBusStation>;

  constructor(model: Model<IBusStation>) {
    this.busStationDBLayer = new DBLayer<IBusStation>(model);
  }

  async createBusStation(
    request: IBusStation,
    session?: ClientSession
  ): Promise<IBusStation[]> {
 

   const createdBusStations = await this.busStationDBLayer.createDocs(
      [request],
      session
    );

    return createdBusStations;
  }

  async returnPaginatedBusStations(request: PaginationRequestData) {
    const paginatedbusStations = await this.busStationDBLayer.paginateData(
      request
    );

    return paginatedbusStations;
  }

  async findBusStationById(request: QueryId) {
    const busStation = await this.busStationDBLayer.findDocById(request);
    return busStation;
  }

  async updateBusStation(request:UpdateRequestData) {
    const updatedbusStation = await this.busStationDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedbusStation;
  }

  async updateManyBusStations(request: updateManyQuery<IBusStation>) {
    const result = await this.busStationDBLayer.updateManyDocs(request);

    return result;
  }

  async bulkUpdateBusStation(request: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    operations: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any;
  }) {
    const result = await this.busStationDBLayer.bulkWriteDocs(request);

    return result;
  }

  async deleteBusStations(request: string[]) {
    return this.busStationDBLayer.deleteDocs(request);
  }

  async aggregateData(request: AggregateData) {
    return await this.busStationDBLayer.aggregateData(request)
  }
}

export const busStationDataLayer = new BusStationRepository(BusStation);

export default BusStationRepository;
