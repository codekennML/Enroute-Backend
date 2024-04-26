import { IChat } from "./../model/interfaces/index";
import { Request, Response } from "express";
import ChatService, { ChatServiceLayer } from "../services/chatService";
import AppResponse from "../utils/helpers/AppResponse";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import User from "../model/user";
import AppError from "../middlewares/errors/BaseError";
import { Types } from "mongoose";
import { ADMINROLES } from "../config/enums";
import Message from "../model/message";

class ChatController {
  private chat: ChatService;

  constructor(chat: ChatService) {
    this.chat = chat;
  }

  async createNewChat(req: Request, res: Response) {
    //create  a chat immediately for a live trip or ride , create a chat once the trip has started for a scheduled trip/ride, this because a trip scheduled in 7 days should not have a chat 7 days prior
    const data: Omit<IChat, "status"> = req.body;

    const createdChat = await this.chat.createChat({
      ...data,
      status: "open",
    });

    return AppResponse(req, res, StatusCodes.CREATED, {
      message: "Chat created successfully",
      data: createdChat,
    });
  }

  async getChatByRideId(req: Request, res: Response) {
    const rideId = req.params.rideId;
    const user = req.user;
    const role = req.role;

    const chat = await this.chat.getSingleChat({
      query: { rideId },
      select: "users latestMessage",
      populatedQuery: [
        {
          path: "users",
          select: "firstname lastname avatar _id ",
          model: User,
        },
        {
          path: "latestMessage",
          select: "body createdAt",
          model: Message,
        },
      ],
    });

    if (!chat)
      throw new AppError(
        getReasonPhrase(StatusCodes.NOT_FOUND),
        StatusCodes.NOT_FOUND
      );

    const chatUsers = chat.users.map((user) => user._id);

    if (
      !chatUsers.includes(new Types.ObjectId(user!.toString())) &&
      !(role! in ADMINROLES)
    )
      throw new AppError(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Chat retrieved successfully",
      data: chat,
    });
  }

  async getChatById(req: Request, res: Response) {
    const { id } = req.params;
    const user = req.user;
    const role = req.role;

    const chat = await this.chat.getSingleChat({
      query: { _id: id },
      select: "users latestMessage status",
      populatedQuery: [
        {
          path: "users",
          select: "firstname lastname avatar _id ",
          model: User,
        },
        {
          path: "latestMessage",
          select: "body createdAt",
          model: Message,
        },
      ],
    });

    if (!chat)
      throw new AppError(
        getReasonPhrase(StatusCodes.NOT_FOUND),
        StatusCodes.NOT_FOUND
      );

    const chatUsers = chat.users.map((user) => user._id);

    if (
      !chatUsers.includes(new Types.ObjectId(user!.toString())) &&
      !(role! in ADMINROLES)
    )
      throw new AppError(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Chat retrieved successfully",
      data: chat,
    });
  }

  async endChat(req: Request, res: Response) {
    const { chatId } = req.body;
    const user = req.user;
    const role = req.role;

    const chat = await this.chat.getSingleChat({
      query: { _id: chatId },
      select: "users",
    });

    if (
      !chat?.users.includes(new Types.ObjectId(user!.toString())) &&
      !(role! in ADMINROLES)
    )
      throw new AppError(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );

    const endedChat = await this.chat.updateChat({
      docToUpdate: {
        _id: chatId,
      },
      updateData: {
        $set: {
          status: "closed",
        },
      },
      options: {
        new: true,
        select: "_id status",
      },
    });

    if (!chat)
      throw new AppError(
        getReasonPhrase(StatusCodes.NOT_FOUND),
        StatusCodes.NOT_FOUND
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: `Chat ${chatId} ended successfully`,
      data: endedChat,
    });
  }

  async deleteChats(req: Request, res: Response) {
    const data: { chatIds: string[] } = req.body;

    const { chatIds } = data;

    if (chatIds.length === 0)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const deletedChats = await this.chat.deleteChats(chatIds);

    return AppResponse(req, res, StatusCodes.OK, {
      message: `${deletedChats.deletedCount} chats deleted.`,
    });
  }
}

const Chats = new ChatController(ChatServiceLayer);

export default Chats;
