import { AggregateData, PaginationRequestData } from "./../repository/shared";
import { ClientSession, Types } from "mongoose";
import { ISOS } from "../model/interfaces";
import SOSRepository, { sosDataLayer } from "../repository/sos";
import { UpdateRequestData } from "../../types/types";

class SOSService {
  private SOS: SOSRepository;

  constructor(service: SOSRepository) {
    this.SOS = service;
  }

  async createSOS(request: ISOS) {
    const SOS = await this.SOS.createSOS(request);

    return SOS; //tThis should return an array of one SOS only
  }

  async findSOS(request: PaginationRequestData) {
    return this.SOS.returnPaginatedSOS(request);
  }

  async updateSOS(request: UpdateRequestData) {
    const updatedSOS = await this.SOS.updateSOS(request);
    return updatedSOS;
  }

  async getSOSById(sosId: string, select?: string, session?: ClientSession) {
    const SOS = await this.SOS.findSOSById({
      query: new Types.ObjectId(sosId),
      select,
      session,
    });

    return SOS;
  }

  async deleteSOS(request: string[]) {
    const deletedSOSs = await this.SOS.deleteSOS(request);

    return deletedSOSs;
  }

  async aggregateSOS(request: AggregateData) {
    return await this.SOS.aggregateData(request)
  }

}

export const SOSServiceLayer = new SOSService(sosDataLayer);

export default SOSService;
