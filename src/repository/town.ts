import Town, { TownModel } from "../model/town";
import { ClientSession, Model } from "mongoose";
import DBLayer, { PaginationRequestData, QueryData } from "./shared";
import { ITown } from "../model/interfaces";

class TownRepository {
  private townDBLayer: DBLayer<TownModel>;

  constructor(model: Model<TownModel>) {
    this.townDBLayer = new DBLayer<TownModel>(model);
  }

  async createTown(
    request: ITown,
    session?: ClientSession
  ): Promise<TownModel[]> {
    let createdTowns: TownModel[] = [];

    createdTowns = await this.townDBLayer.createDocs([request], session);

    return createdTowns;
  }

  async returnPaginatedTowns(request: PaginationRequestData) {
    const paginatedTowns = await this.townDBLayer.paginateData(request);

    return paginatedTowns;
  }

  async findTownById(request: QueryData) {
    const Town = await this.townDBLayer.findDocById(request);
    return Town;
  }

  async updateTown(request: {
    docToUpdate: { [key: string]: Record<"$eq", string> };
    updateData: { [k: string]: string | object | boolean };
    options: {
      new?: boolean;
      session?: ClientSession;
      select?: string;
      upsert?: boolean;
      includeResultMetadata?: boolean;
    };
  }) {
    const updatedTown = await this.townDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedTown;
  }

  async deleteTowns(request: string[]) {
    return this.townDBLayer.deleteDocs(request);
  }
}

export const TownDataLayer = new TownRepository(Town);

export default TownRepository;
