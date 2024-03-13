import UserRepository, { UserDataLayer } from "../repository/mongo/User";

import AppError from "../middlewares/errors/BaseError";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { ClientSession } from "mongoose";
import { UpdateRequestData } from "../../types/types";
import { QueryData } from "../repository/mongo/shared";
import { IUser } from "../model/interfaces";

class User {
  private user: UserRepository;

  constructor(dataLayer: UserRepository) {
    this.user = dataLayer;
  }

  async createUser(
    userData: Required<Pick<IUser, "firstName" | "lastName" | "mobile">>
  ) {
    const user = await this.user.createUser(userData);

    return user;
  }

  async getUsers(request: QueryData) {
    const users = await this.user.getUsers(request);

    return users;
    return users;
  }

  async getUserInfo(userId: string, select: string, session?: ClientSession) {
    const user = await this.user.getUsers({
      query: { id: userId },
      select,
      session,
    });

    if (!user || user.length === 0)
      throw new AppError(
        getReasonPhrase(StatusCodes.NOT_FOUND),
        StatusCodes.NOT_FOUND
      );

    return user[0];
  }

  async updateUser(request: UpdateRequestData) {
    const updatedUser = await this.user.updateUser(request);
    return updatedUser;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async bulkUpdateUser(request: any, session: ClientSession) {
    const { operations } = request;

    const updatedAccountData = await this.user.bulkUpdateUsers({
      operations,
      options: { session },
    });

    return {
      success: true,
      data: updatedAccountData,
    };
  }
}

export const UserServiceLayer = new User(UserDataLayer);

export default User;
