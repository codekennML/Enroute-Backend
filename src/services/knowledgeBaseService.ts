import { PaginationRequestData } from "./../repository/shared";
import { ClientSession } from "mongoose";
import { IKnowledgeBase } from "../model/interfaces";
import KnowledgeBaseRepository, {
  KnowledgeBaseDataLayer,
} from "../repository/knowledgeBase";
import { UpdateRequestData } from "../../types/types";

class KnowledgeBaseService {
  private KnowledgeBase: KnowledgeBaseRepository;

  constructor(service: KnowledgeBaseRepository) {
    this.KnowledgeBase = service;
  }

  async createKnowledgeBase(request: IKnowledgeBase) {
    const KnowledgeBase = await this.KnowledgeBase.createKnowledgeBase(request);

    return KnowledgeBase; //tThis should return an array of one KnowledgeBase only
  }

  async findKnowledgeBases(request: PaginationRequestData) {
    return this.KnowledgeBase.returnPaginatedKnowledgeBases(request);
  }

  async updateKnowledgeBase(request: UpdateRequestData) {
    const updatedKnowledgeBase = await this.KnowledgeBase.updateKnowledgeBase(
      request
    );
    return updatedKnowledgeBase;
  }

  async getKnowledgeBaseById(
    KnowledgeBaseId: string,
    select?: string,
    session?: ClientSession
  ) {
    const KnowledgeBase = await this.KnowledgeBase.findKnowledgeBaseById({
      query: { id: KnowledgeBaseId },
      select,
      session,
    });

    return KnowledgeBase;
  }

  async deleteKnowledgeBases(request: string[]) {
    const deletedKnowledgeBases = await this.KnowledgeBase.deleteKnowledgeBases(
      request
    );

    return deletedKnowledgeBases;
  }
}

export const KnowledgeBaseServiceLayer = new KnowledgeBaseService(
  KnowledgeBaseDataLayer
);

export default KnowledgeBaseService;
