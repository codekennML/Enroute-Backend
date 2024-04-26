import { PaginationRequestData, QueryData } from "./../repository/shared";
import { ClientSession } from "mongoose";
import { ISettlements } from "../model/interfaces";
import SettlementsRepository, {
  settlementDataLayer,
} from "../repository/settlements";
import { UpdateRequestData } from "../../types/types";

class SettlementService {
  private settlements: SettlementsRepository;

  constructor(service: SettlementsRepository) {
    this.settlements = service;
  }

  async createSettlements(request: ISettlements, session?: ClientSession) {
    const settlements = await this.settlements.createSettlement(
      request,
      session
    );

    return settlements; //tThis should return an array of one settlements only
  }

  async findSettlements(request: PaginationRequestData) {
    return this.settlements.returnPaginatedSettlements(request);
  }

  async returnPopulatedSettlement(request: QueryData) {
    return await this.settlements.getPopulatedSettlement(request);
  }

  async updateSettlements(request: UpdateRequestData) {
    const updatedsettlements = await this.settlements.updateSettlement(request);
    return updatedsettlements;
  }

  async getSettlementsById(
    settlementId: string,
    select?: string,
    session?: ClientSession
  ) {
    const settlements = await this.settlements.findSettlementById({
      query: { _id: settlementId },
      select,
      session,
    });

    return settlements;
  }

  async deleteSettlements(request: string[]) {
    return this.settlements.deleteSettlements(request);
  }
}

export const SettlementServiceLayer = new SettlementService(
  settlementDataLayer
);

export default SettlementService;
