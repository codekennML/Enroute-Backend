import Documents, { IDocumentsModel } from "../model/documents";
import { ClientSession, Model } from "mongoose";
import DBLayer, {
  AggregateData,
  PaginationRequestData,
  QueryData,
  updateManyQuery,
} from "./shared";
import { IDocuments } from "../model/interfaces";

class DocumentsRepository {
  private documentsDBLayer: DBLayer<IDocumentsModel>;

  constructor(model: Model<IDocumentsModel>) {
    this.documentsDBLayer = new DBLayer<IDocumentsModel>(model);
  }

  async createDocuments(
    request: IDocuments[],
    session?: ClientSession
  ): Promise<IDocumentsModel[]> {
    let createdDocumentss: IDocumentsModel[] = [];

    createdDocumentss = await this.documentsDBLayer.createDocs(
      request,
      session
    );

    return createdDocumentss;
  }

  async findDocumentById(request: QueryData) {
    const document = await this.documentsDBLayer.findDocById(request);
    return document;
  }
  async findDocuments(request: QueryData) {
    const documents = await this.documentsDBLayer.findDocs(request);

    return documents;
  }

  async returnPaginatedDocumentss(request: PaginationRequestData) {
    const paginatedDocumentss = await this.documentsDBLayer.paginateData(
      request
    );

    return paginatedDocumentss;
  }

  async updateDocuments(request: {
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
    const updatedDocuments = await this.documentsDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedDocuments;
  }

  async updateManyDocuments(request: updateManyQuery<IDocumentsModel>) {
    const result = await this.documentsDBLayer.updateManyDocs(request);

    return result;
  }

  async deleteDocuments(request: string[]) {
    const deletedDocs = await this.documentsDBLayer.deleteDocs(request);

    return deletedDocs;
  }

  async aggregateData(request: AggregateData) {
    return await this.documentsDBLayer.aggregateData(request)
  }
}

export const DocumentsDataLayer = new DocumentsRepository(Documents);

export default DocumentsRepository;
