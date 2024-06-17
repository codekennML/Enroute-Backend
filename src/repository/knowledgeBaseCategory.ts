import { IKnowledgeBaseCategory } from "./../model/interfaces/index";
import KnowledgeBaseCategory from "../model/knowledgeBaseCategory";
import { ClientSession, Model } from "mongoose";
import DBLayer, { PaginationRequestData, QueryData } from "./shared";
import { UpdateRequestData } from "../../types/types";

class KnowledgeBaseCategoryRepository {
  private KnowledgeBaseCategoryDBLayer: DBLayer<IKnowledgeBaseCategory>;

  constructor(model: Model<IKnowledgeBaseCategory>) {
    this.KnowledgeBaseCategoryDBLayer = new DBLayer<IKnowledgeBaseCategory>(
      model
    );
  }

  async createKnowledgeBaseCategory(
    request: IKnowledgeBaseCategory,
    session?: ClientSession
  ): Promise<IKnowledgeBaseCategory[]> {
    let createdKnowledgeBaseCategorys: IKnowledgeBaseCategory[] = [];

    createdKnowledgeBaseCategorys =
      await this.KnowledgeBaseCategoryDBLayer.createDocs([request], session);

    return createdKnowledgeBaseCategorys;
  }

  async returnPaginatedKnowledgeBaseCategories(request: PaginationRequestData) {
    const paginatedKnowledgeBaseCategorys =
      await this.KnowledgeBaseCategoryDBLayer.paginateData(request);

    return paginatedKnowledgeBaseCategorys;
  }

  async findKnowledgeBaseCategoryById(request: QueryData) {
    const KnowledgeBaseCategory =
      await this.KnowledgeBaseCategoryDBLayer.findDocById(request);
    return KnowledgeBaseCategory;
  }

  async updateKnowledgeBaseCategory(request: UpdateRequestData
  ) {
    const updatedKnowledgeBaseCategory =
      await this.KnowledgeBaseCategoryDBLayer.updateDoc({
        docToUpdate: request.docToUpdate,
        updateData: request.updateData,
        options: request.options,
      });

    return updatedKnowledgeBaseCategory;
  }

  async deleteKnowledgeBaseCategories(request: string[]) {
    return this.KnowledgeBaseCategoryDBLayer.deleteDocs(request);
  }
}

export const KnowledgeBaseCategoryDataLayer =
  new KnowledgeBaseCategoryRepository(KnowledgeBaseCategory);

export default KnowledgeBaseCategoryRepository;
