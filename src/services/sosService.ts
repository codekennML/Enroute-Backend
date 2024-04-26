import { PaginationRequestData } from "./../repository/shared";
import { ClientSession } from "mongoose";
import { ISOS } from "../model/interfaces";
import SOSRepository, { SOSDataLayer } from "../repository/sos";
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

  async findSOSs(request: PaginationRequestData) {
    return this.SOS.returnPaginatedSOS(request);
  }

  async updateSOS(request: UpdateRequestData) {
    const updatedSOS = await this.SOS.updateSOS(request);
    return updatedSOS;
  }

  async getSOSById(SOSId: string, select?: string, session?: ClientSession) {
    const SOS = await this.SOS.findSOSById({
      query: { id: SOSId },
      select,
      session,
    });

    return SOS;
  }

  async deleteSOSs(request: string[]) {
    const deletedSOSs = await this.SOS.deleteSOSs(request);

    return deletedSOSs;
  }
}

export const SOSServiceLayer = new SOSService(SOSDataLayer);

export default SOSService;
