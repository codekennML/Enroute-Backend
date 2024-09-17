import { AggregateData, PaginationRequestData } from "./../repository/shared";
import { ClientSession, PopulateOptions, Types } from "mongoose";
import { ITown } from "../model/interfaces";
import TownRepository, { TownDataLayer } from "../repository/town";
import { UpdateRequestData } from "../../types/types";

class TownService {
  private Town: TownRepository;

  constructor(service: TownRepository) {
    this.Town = service;
  }

  async createTown(request: ITown) {
    const Town = await this.Town.createTown(request);

    return Town; //tThis should return an array of one Town only
  }

  async findTowns(request: PaginationRequestData) {
    return this.Town.returnPaginatedTowns(request);
  }

  async updateTown(request: UpdateRequestData) {
    const updatedTown = await this.Town.updateTown(request);
    return updatedTown;
  }

  async getTownById(townId: string, select?: string, session?: ClientSession, populatedQuery?: PopulateOptions[]) {
    const Town = await this.Town.findTownById({
      query: new Types.ObjectId(townId),
      select,
      session,
      populatedQuery
    });

    return Town;
  }

  async deleteTowns(request: string[]) {
    const deletedTowns = await this.Town.deleteTowns(request);
    return deletedTowns;
  }

  async aggregateTowns(request: AggregateData) {
    return await this.Town.aggregateTowns(request)
  }
}

export const TownServiceLayer = new TownService(TownDataLayer);

export default TownService;
