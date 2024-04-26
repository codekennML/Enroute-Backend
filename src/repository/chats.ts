import Chat, { ChatModel } from "../model/chat";
import { ClientSession, Model } from "mongoose";
import DBLayer, {
  PaginationRequestData,
  QueryData,
  updateManyQuery,
} from "./shared";
import { IChat } from "../model/interfaces";

class ChatRepository {
  private chatDBLayer: DBLayer<ChatModel>;

  constructor(model: Model<ChatModel>) {
    this.chatDBLayer = new DBLayer<ChatModel>(model);
  }

  async createChat(
    request: IChat,
    session?: ClientSession
  ): Promise<ChatModel[]> {
    let createdChats: ChatModel[] = [];

    createdChats = await this.chatDBLayer.createDocs([request], session);

    return createdChats;
  }

  async returnPaginatedChats(request: PaginationRequestData) {
    const paginatedChats = await this.chatDBLayer.paginateData(request);

    return paginatedChats;
  }

  async findChatById(request: QueryData) {
    const chat = await this.chatDBLayer.findDocById(request);
    return chat;
  }

  async findChats(request: QueryData) {
    const chatData = await this.chatDBLayer.findDocs(request);
    return chatData;
  }

  async updateChat(request: {
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
    const updatedChat = await this.chatDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedChat;
  }

  async updateManyChats(request: updateManyQuery<ChatModel>) {
    const result = await this.chatDBLayer.updateManyDocs(request);

    return result;
  }

  async bulkUpdateChat(request: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    operations: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any;
  }) {
    const result = await this.chatDBLayer.bulkWriteDocs(request);

    return result;
  }

  async deleteChats(request: string[]) {
    return this.chatDBLayer.deleteDocs(request);
  }
}

export const ChatDataLayer = new ChatRepository(Chat);

export default ChatRepository;
