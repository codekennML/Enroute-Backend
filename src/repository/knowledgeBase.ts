import { IKnowledgeBase } from "./../model/interfaces/index";
import KnowledgeBase from "../model/knowledgeBase";
import { ClientSession, Model } from "mongoose";
import DBLayer, { AggregateData, PaginationRequestData, QueryData } from "./shared";
import { UpdateRequestData } from "../../types/types";

class KnowledgeBaseRepository {
  private KnowledgeBaseDBLayer: DBLayer<IKnowledgeBase>;

  constructor(model: Model<IKnowledgeBase>) {
    this.KnowledgeBaseDBLayer = new DBLayer<IKnowledgeBase>(model);
  }

  async createKnowledgeBase(
    request: IKnowledgeBase,
    session?: ClientSession
  ): Promise<IKnowledgeBase[]> {
    let createdKnowledgeBases: IKnowledgeBase[] = [];

    createdKnowledgeBases = await this.KnowledgeBaseDBLayer.createDocs(
      [request],
      session
    );

    return createdKnowledgeBases;
  }

  async returnPaginatedKnowledgeBases(request: PaginationRequestData) {
    const paginatedKnowledgeBases =
      await this.KnowledgeBaseDBLayer.paginateData(request);

    return paginatedKnowledgeBases;
  }

  async findKnowledgeBaseById(request: QueryData) {
    const KnowledgeBase = await this.KnowledgeBaseDBLayer.findDocById(request);
    return KnowledgeBase;
  }

  async updateKnowledgeBase(request: UpdateRequestData) {
    const updatedKnowledgeBase = await this.KnowledgeBaseDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedKnowledgeBase;
  }

  async deleteKnowledgeBases(request: string[]) {
    return this.KnowledgeBaseDBLayer.deleteDocs(request);
  }

  async aggregateData(request: AggregateData) {
    return await this.KnowledgeBaseDBLayer.aggregateData(request)
  }
}

export const KnowledgeBaseDataLayer = new KnowledgeBaseRepository(
  KnowledgeBase
);

export default KnowledgeBaseRepository;
