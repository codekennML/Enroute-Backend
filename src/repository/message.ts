import Message, { MessageModel } from "../model/message";
import { ClientSession, Model } from "mongoose";
import DBLayer, { PaginationRequestData, QueryData } from "./shared";

import { IMessage } from "../model/interfaces";

class MessageRepository {
  private messageDBLayer: DBLayer<MessageModel>;

  constructor(model: Model<MessageModel>) {
    this.messageDBLayer = new DBLayer<MessageModel>(model);
  }

  async createMessage(
    request: IMessage,
    session?: ClientSession
  ): Promise<MessageModel[]> {
    let createdMessages: MessageModel[] = [];

    createdMessages = await this.messageDBLayer.createDocs([request], session);

    return createdMessages;
  }

  async returnPaginatedMessages(request: PaginationRequestData) {
    const paginatedMessages = await this.messageDBLayer.paginateData(request);

    return paginatedMessages;
  }

  async findMessageById(request: QueryData) {
    const document = await this.messageDBLayer.findDocById(request);
    return document;
  }

  async updateMessage(request: {
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
    const updatedMessage = await this.messageDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedMessage;
  }

  //   async updateManyMessages(request: updateManyQuery<MessageModel>) {
  //     const result = await this.messageDBLayer.updateManyDocs(request);

  //     return result;
  //   }

  //   async deleteMessages(request: string[]) {
  //     return this.messageDBLayer.deleteDocs(request);
  //   }
}

export const MessageDataLayer = new MessageRepository(Message);

export default MessageRepository;
