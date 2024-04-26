import { PaginationRequestData } from "./../repository/shared";
import { ClientSession } from "mongoose";
import { IKnowledgeBaseCategory } from "../model/interfaces";
import KnowledgeBaseCategoryRepository, {
  KnowledgeBaseCategoryDataLayer,
} from "../repository/knowledgeBaseCategory";
import { UpdateRequestData } from "../../types/types";

class KnowledgeBaseCategoryService {
  private KnowledgeBaseCategory: KnowledgeBaseCategoryRepository;

  constructor(service: KnowledgeBaseCategoryRepository) {
    this.KnowledgeBaseCategory = service;
  }

  async createKnowledgeBaseCategory(request: IKnowledgeBaseCategory) {
    const KnowledgeBaseCategory =
      await this.KnowledgeBaseCategory.createKnowledgeBaseCategory(request);

    return KnowledgeBaseCategory; //tThis should return an array of one KnowledgeBaseCategory only
  }

  async findKnowledgeBaseCategorys(request: PaginationRequestData) {
    return this.KnowledgeBaseCategory.returnPaginatedKnowledgeBaseCategories(
      request
    );
  }

  async updateKnowledgeBaseCategory(request: UpdateRequestData) {
    const updatedKnowledgeBaseCategory =
      await this.KnowledgeBaseCategory.updateKnowledgeBaseCategory(request);
    return updatedKnowledgeBaseCategory;
  }

  async getKnowledgeBaseCategoryById(
    KnowledgeBaseCategoryId: string,
    select?: string,
    session?: ClientSession
  ) {
    const KnowledgeBaseCategory =
      await this.KnowledgeBaseCategory.findKnowledgeBaseCategoryById({
        query: { id: KnowledgeBaseCategoryId },
        select,
        session,
      });

    return KnowledgeBaseCategory;
  }

  async deleteKnowledgeBaseCategorys(request: string[]) {
    const deletedKnowledgeBaseCategorys =
      await this.KnowledgeBaseCategory.deleteKnowledgeBaseCategorys(request);

    return deletedKnowledgeBaseCategorys;
  }
}

export const KnowledgeBaseCategoryServiceLayer =
  new KnowledgeBaseCategoryService(KnowledgeBaseCategoryDataLayer);

export default KnowledgeBaseCategoryService;
