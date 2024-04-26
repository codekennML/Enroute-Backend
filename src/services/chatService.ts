import { PaginationRequestData, QueryData } from "./../repository/shared";
import { IChat } from "../model/interfaces";
import ChatRepository, { ChatDataLayer } from "../repository/chats";
import { UpdateRequestData } from "../../types/types";
import { ClientSession } from "mongoose";

class ChatService {
  private chat: ChatRepository;

  constructor(service: ChatRepository) {
    this.chat = service;
  }

  async createChat(request: IChat, session?: ClientSession) {
    const createdChat = await this.chat.createChat(request, session);

    return createdChat;
  }

  async getSingleChat(request: QueryData) {
    const chat = await this.chat.findChatById(request);

    return chat;
  }

  async getPaginatedChats(request: PaginationRequestData) {
    return this.chat.returnPaginatedChats(request);
  }

  async updateChat(request: UpdateRequestData) {
    const updatedChat = await this.chat.updateChat(request);
    return updatedChat;
  }

  async deleteChats(request: string[]) {
    const deletedChats = await this.chat.deleteChats(request);

    return deletedChats;
  }
}

export const ChatServiceLayer = new ChatService(ChatDataLayer);

export default ChatService;
