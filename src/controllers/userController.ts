import { AnyBulkWriteOperation } from "mongodb";
import { UpdateRequestData } from "./../../types/types.d";
import { HttpResponse, HttpRequest } from "uWebsockets.js";
import { readJSON } from "../utils/helpers/decodePostJSON";
import UserService, { UserServiceLayer } from "../services/userService";
import AppResponse from "../utils/helpers/AppResponse";
import { StatusCodes } from "http-status-codes";
import { IUser } from "../model/interfaces";
import { retryTransaction } from "../utils/helpers/retryTransaction";

class User {
  private user: UserService;

  constructor(userService: UserService) {
    this.user = userService;
  }

  async createUser(res: HttpResponse, req: HttpRequest) {
    const data = await readJSON<
      Required<Pick<IUser, "firstName" | "lastName" | "mobile" | "roles">> &
        Pick<IUser, "fbId" | "appleId" | "googleId">
    >(res);

    const newUser = {
      ...data,
    };

    const createdUser = await this.user.createUser(newUser);

    return AppResponse(res, req, StatusCodes.CREATED, createdUser);
  }

  async getUsers(res: HttpResponse, req: HttpRequest) {
    const data = await readJSON<Partial<IUser> & { user?: string }>(res);

    const users = await this.user.getUsers({
      query: {
        ...data,
        _id: data.user,
      },
      select: "_id email mobile firstName lastName googleId fbId appleId",
    });

    return AppResponse(res, req, StatusCodes.OK, { users });
  }

  async updateUser(res: HttpResponse, req: HttpRequest) {
    interface UpdateUser {
      userId: string;
      update: Pick<UpdateRequestData, "updateData">;
    }

    const data = await readJSON<UpdateUser>(res);

    const { userId, update } = data;

    const updatedUser = await this.user.updateUser({
      docToUpdate: { _id: { $eq: userId } },
      updateData: update,
      options: { new: true, select: "_id firstname " },
    });

    return AppResponse(res, req, StatusCodes.OK, { user: updatedUser });
  }

  async deleteUsers() {}

  async bulkUpdateUsers(res: HttpResponse, req: HttpRequest) {
    const data = await readJSON<AnyBulkWriteOperation<IUser>[]>(res);

    const operations = data;

    const result = await retryTransaction(this.user.bulkUpdateUsers, 1, {
      operations,
    });

    return AppResponse(res, req, StatusCodes.OK, {
      insertedIds: result.data.insertedIds,
      upsertedIds: result.data.upsertedIds,
    });
  }
}

export const UserController = new User(UserServiceLayer);
