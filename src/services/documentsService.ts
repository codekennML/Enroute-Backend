import { PaginationRequestData, QueryData } from "./../repository/shared";
import { UpdateRequestData } from "../../types/types";
import { IDocuments } from "../model/interfaces";
import DocumentsRepository, {
  DocumentsDataLayer,
} from "../repository/documents";

class DocumentsService {
  private documents: DocumentsRepository;

  constructor(repository: DocumentsRepository) {
    this.documents = repository;
  }

  async createDocuments(request: IDocuments) {
    const createdDocument = await this.documents.createDocuments([request]);

    return createdDocument;
  }

  async getDocumentsWithPopulate(request: QueryData) {
    return this.documents.findDocuments(request);
  }

  async getDocumentById(request: QueryData) {
    const document = await this.documents.findDocumentById(request);

    return document;
  }

  async updateDocument(request: UpdateRequestData) {
    //This operation uses a transaction,  session is embedded within the UpdateRequestData options key
    const updatedUser = await this.documents.updateDocuments(request);
    return updatedUser;
  }

  async findDocuments(request: PaginationRequestData) {
    return this.documents.returnPaginatedDocumentss(request);
  }

  async deleteDocuments(userIds: string[]) {
    const deletedDocuments = await this.documents.deleteDocuments(userIds);

    return deletedDocuments;
  }
}

export const DocumentsServiceLayer = new DocumentsService(DocumentsDataLayer);

export default DocumentsService;
