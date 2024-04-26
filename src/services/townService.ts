import { PaginationRequestData } from "./../repository/shared";
import { ClientSession } from "mongoose";
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

  async getTownById(TownId: string, select?: string, session?: ClientSession) {
    const Town = await this.Town.findTownById({
      query: { id: TownId },
      select,
      session,
    });

    return Town;
  }

  async deleteTowns(request: string[]) {
    const deletedTowns = await this.Town.deleteTowns(request);
    return deletedTowns;
  }
}

export const TownServiceLayer = new TownService(TownDataLayer);

export default TownService;
