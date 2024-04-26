import { PaginationRequestData } from "./../repository/shared";
import { ClientSession } from "mongoose";
import { IRide } from "../model/interfaces";
import RideRepository, { RideDataLayer } from "../repository/ride";
import { UpdateRequestData } from "../../types/types";

import { retryTransaction } from "../utils/helpers/retryTransaction";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";

class RideService {
  private Ride: RideRepository;

  constructor(service: RideRepository) {
    this.Ride = service;
  }

  async createRide(request: IRide) {
    const Ride = await this.Ride.createRide(request);

    return Ride; //tThis should return an array of one Ride only
  }

  async findRides(request: PaginationRequestData) {
    return this.Ride.returnPaginatedRides(request);
  }

  async updateRide(request: UpdateRequestData) {
    const updatedRide = await this.Ride.updateRide(request);
    return updatedRide;
  }

  async getRideById(RideId: string, select?: string, session?: ClientSession) {
    const Ride = await this.Ride.findRideById({
      query: { id: RideId },
      select,
      session,
    });

    return Ride;
  }

  async deleteRides(request: string[]) {
    const deletedRides = await this.Ride.deleteRides(request);

    return deletedRides;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async bulkWriteRides(request: any, session: ClientSession) {
    const { operations } = request;
    const result = await this.Ride.bulkUpdateRide({
      operations,
      options: { session },
    });

    return result;
  }

  async bulkAddRide(request: IRide[]) {
    //@ts-expect-error //This is a bulkwrite
    //TODO Set the correct type here
    const operations = [];

    request.map((Ride) => {
      operations.push({
        insertOne: {
          document: {
            ...Ride,
          },
        },
      });
    });

    const response = await retryTransaction(this.bulkWriteRides, 1, {
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

export const RideServiceLayer = new RideService(RideDataLayer);

export default RideService;
