import { PaginationRequestData } from "./../repository/shared";
import { ClientSession } from "mongoose";
import { IBusStation } from "../model/interfaces";
import BusStationRepository, {
  busStationDataLayer,
} from "../repository/busStation";
import { UpdateRequestData } from "../../types/types";

import { retryTransaction } from "../utils/helpers/retryTransaction";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";

class BusStationService {
  private busStation: BusStationRepository;

  constructor(service: BusStationRepository) {
    this.busStation = service;
  }

  async createBusStation(request: IBusStation) {
    const busStation = await this.busStation.createBusStation(request);

    return busStation; //tThis should return an array of one BusStation only
  }

  async findBusStations(request: PaginationRequestData) {
    return this.busStation.returnPaginatedBusStations(request);
  }

  async updateBusStation(request: UpdateRequestData) {
    const updatedBusStation = await this.busStation.updateBusStation(request);
    return updatedBusStation;
  }

  async getBusStationById(
    busStationId: string,
    select?: string,
    session?: ClientSession
  ) {
    const busStation = await this.busStation.findBusStationById({
      query: { id: busStationId },
      select,
      session,
    });

    return busStation;
  }

  async deleteBusStations(request: string[]) {
    const deletedBusStations = await this.busStation.deleteBusStations(request);

    return deletedBusStations;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async bulkWriteBusStations(request: any, session: ClientSession) {
    const { operations } = request;
    const result = await this.busStation.bulkUpdateBusStation({
      operations,
      options: { session },
    });

    return result;
  }

  async bulkAddBusStation(request: IBusStation[]) {
    //@ts-expect-error //This is a bulkwrite
    //TODO Set the correct type here
    const operations = [];

    request.map((busStation) => {
      operations.push({
        insertOne: {
          document: {
            ...busStation,
          },
        },
      });
    });

    const response = await retryTransaction(this.bulkWriteBusStations, 1, {
      //@ts-expect-error this operation is a bulkwrite
      operations,
    });

    if (!response)
      throw new AppError(
        getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        StatusCodes.INTERNAL_SERVER_ERROR
      );
  }
}

export const BusStationServiceLayer = new BusStationService(
  busStationDataLayer
);

export default BusStationService;
