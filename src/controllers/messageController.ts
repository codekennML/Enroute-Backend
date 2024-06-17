import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import MessageService, {
  MessageServiceLayer,
} from "../services/messageService";
import { Request, Response } from "express";
import { IMessage } from "../model/interfaces";
import AppResponse from "../utils/helpers/AppResponse";
import { MatchQuery, SortQuery } from "../../types/types";
import { ChatServiceLayer } from "../services/chatService";
import { ClientSession, Types } from "mongoose";
import { retryTransaction } from "../utils/helpers/retryTransaction";
import { sortRequest } from "../utils/helpers/sortQuery";
import { isNotAuthorizedToPerformAction } from "../utils/helpers/isAuthorizedForAction";

class MessageController {
  private Message: MessageService;

  constructor(service: MessageService) {
    this.Message = service;
  }
  //TODO Move to websocket server
  async createMessage(req: Request, res: Response) {
    const data: IMessage = req.body;
    const user = req.user!
    const role = req.role


  
    //Check that user is part of this chat , otherwise throw error

    //TODO : Cache the users within a chat so we can easily validate a request against the user

    

    //TODO const data = await chatCache.get(`${chatId}`) , if(!data) //Pull from db

  
   

    //The transaction function
    const createMessageSession = async (
      args: { data: typeof data; user: string; role: string },
      session: ClientSession
    ) => {
      const response = await session.withTransaction(async () => {
        const { chatId } = args.data;

        const chat = await ChatServiceLayer.getSingleChat({
          query: { _id: chatId },
          select: "users",
        });


        if (!chat)
          throw new AppError(
            getReasonPhrase(StatusCodes.NOT_FOUND),
            StatusCodes.NOT_FOUND
          );

        if (
          !chat?.users?.includes(new Types.ObjectId(user?.toString())) &&
          isNotAuthorizedToPerformAction(req)
        )
          throw new AppError(
            getReasonPhrase(StatusCodes.FORBIDDEN),
            StatusCodes.FORBIDDEN
          );

        const createdMessage = await this.Message.createMessage(
          {
            chatId: new Types.ObjectId(args.data.chatId),
            body: args.data.body,
            sentBy: new Types.ObjectId(args.data.sentBy),
          },
          session
        );

        //Update the chat with the newly created message as latest message

        const updatedChat = await ChatServiceLayer.updateChat({
          docToUpdate: {
            _id: data.chatId,
          },
          updateData: {
            $set: {
              latestMessage: createdMessage[0]._id,
            },
          },
          options: { session, new: false },
        });

        if (!updatedChat)
          throw new AppError(
            getReasonPhrase(StatusCodes.BAD_REQUEST),
            StatusCodes.BAD_REQUEST
          );

        return createdMessage[0];
      });

      return response;
    };

    const response = await retryTransaction(createMessageSession, 1, {
      data,
      role,
      user
    });

    return AppResponse(req, res, StatusCodes.CREATED, {
      message: "Message created successfully",
      data: response,
    });
  }

  async getMessages(req: Request, res: Response) {
    const data: {
      chatId? : string
      cursor?: string;
      sort?: string;
      userId: string
      dateFrom?: Date;
      dateTo?: Date;
    } = req.body;

    const matchQuery: MatchQuery = {};

    if (data?.chatId) {
      matchQuery.chatId = { $eq: data.chatId };
    }

    if (data?.userId) {
      matchQuery.sentBy = { $eq: data.userId }
    }

    if (data?.dateFrom) {
      matchQuery.createdAt = { $gte: new Date(data.dateFrom), $lte: data?.dateTo ?? new Date(Date.now()) };
    }

    const sortQuery: SortQuery = sortRequest(data?.sort);

  

    if (data?.cursor) {
      const orderValue = Object.values(sortQuery)[0] as unknown as number;

      const order =
        orderValue === 1 ? { $gt: data.cursor } : { $lt: data?.cursor };

      matchQuery._id = order;
    }

    const query = {
      query: matchQuery,
      aggregatePipeline: [
        sortQuery,
        { $limit: 101 },
        {
          $lookup: {
            from: "users",
            localField: "sentBy",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  avatar: 1,
                  _id: 1,
                },
              },
            ],
            as: "$sender",
          },
        },
        {
          $unwind: "$$sender",
        },
        {
          $unset: "$sentBy",
        },
      ],
      pagination: { pageSize: 100 },
    };

    const result = await this.Message.findMessages(query);

    const hasData = result?.data?.length === 0;

    return AppResponse(
      req,
      res,
      hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
      {
        message: hasData
          ? `Messages  retrieved succesfully`
          : `No messages were found for this request `,
        data: result,
      }
    );
  }

  //TODO Move to websocket server
  // async updateMessageDeliveryStatus(messageId: string) {
  

  //   const updatedMessage = await this.Message.updateMessage({
  //     docToUpdate: { _id: messageId },
  //     updateData: {
  //       $set: {
  //         deliveredAt: new Date(),
  //       },
  //     },
  //     options: { new: true, select: "_id" },
  //   });

  //   if (!updatedMessage)
  //     throw new AppError(
  //       getReasonPhrase(StatusCodes.BAD_REQUEST),
  //       StatusCodes.BAD_REQUEST
  //     );

  //   return updatedMessage;
  // }




  async deleteMessages(req: Request, res: Response) {
    const data: { messageIds: string[] } = req.body;

    const { messageIds } = data;

    if (messageIds.length === 0)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const deletedMessages = await this.Message.deleteMessages (messageIds);

    return AppResponse(req, res, StatusCodes.OK, {
      message: `${deletedMessages.deletedCount} chats deleted.`,
    });
  }
}

export const Message = new MessageController(MessageServiceLayer);

export default Message;
