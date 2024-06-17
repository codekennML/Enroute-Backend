import { PaginationRequestData, QueryData } from "./../repository/shared";
import { IMessage } from "../model/interfaces";
import messageRepository, { MessageDataLayer } from "../repository/message";
import { ClientSession } from "mongoose";
import { UpdateRequestData } from "../../types/types";

class messageService {
  private message: messageRepository;

  constructor(service: messageRepository) {
    this.message = service;
  }

  async createMessage(request: IMessage, session?: ClientSession) {
    const message = await this.message.createMessage(request, session);

    return message; //tThis should return an array of one message only
  }

  async findMessages(request: PaginationRequestData) {
    return this.message.returnPaginatedMessages(request);
  }

  async getMessageById(request: QueryData) {
    const message = await this.message.findMessageById(request);

    return message;
  }

  async updateMessage(request: UpdateRequestData) {
    return await this.message.updateMessage(request);
  }

  async deleteMessages(request : string[]) {
     
    const deletedMessages  = await this.message.deleteMessages(request)

    return deletedMessges

  }
}

export const MessageServiceLayer = new messageService(MessageDataLayer);

export default messageService;
