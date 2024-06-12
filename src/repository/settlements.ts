import Settlement from "../model/settlements";
import { ClientSession, Model } from "mongoose";
import DBLayer, {
  AggregateData,
  PaginationRequestData,
  QueryData,
  updateManyQuery,
} from "./shared";
import { ISettlements } from "../model/interfaces";

class SettlementRepository {
  private settlementDBLayer: DBLayer<ISettlements>;

  constructor(model: Model<ISettlements>) {
    this.settlementDBLayer = new DBLayer<ISettlements>(model);
  }

  async createSettlement(
    request: ISettlements,
    session?: ClientSession
  ) {


    const createdsettlements = await this.settlementDBLayer.createDocs(
      [request],
      session
    );

    return createdsettlements;
  }

  async returnPaginatedSettlements(request: PaginationRequestData) {
    const paginatedsettlements = await this.settlementDBLayer.paginateData(
      request
    );

    return paginatedsettlements;
  }

  async updateSettlement(request: {
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
    const updatedsettlement = await this.settlementDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedsettlement;
  }

  async updateManysettlements(request: updateManyQuery<ISettlements>) {
    const result = await this.settlementDBLayer.updateManyDocs(request);

    return result;
  }

  async findSettlementById(request: QueryData) {
    const settlement = await this.settlementDBLayer.findDocById(request);
    return settlement;
  }

  async deleteSettlements(request: string[]) {
    return this.settlementDBLayer.deleteDocs(request);
  }

  async getPopulatedSettlement(request: QueryData) {
    return this.settlementDBLayer.findDocs(request);
  }

  async aggregateData(request: AggregateData) {
    return await this.settlementDBLayer.aggregateData(request)
  }

}

export const settlementDataLayer = new SettlementRepository(Settlement);

export default SettlementRepository;
