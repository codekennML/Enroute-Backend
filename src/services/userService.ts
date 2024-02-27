import UserRepository, { UserDataLayer } from "../repository/mongo/User";
import { HttpResponse } from "uWebsockets.js";
import { readJSON } from "../utils/helpers/decodePostJSON";
import AppError from "../middlewares/errors/BaseError";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { ClientSession } from "mongoose";
import { UpdateRequestData } from "../../types/types";
import { QueryData } from "../repository/mongo/shared";

class User {
  private user: UserRepository;

  constructor(dataLayer: UserRepository) {
    this.user = dataLayer;
  }

  async createUser() {
    const user = await this.user.createUser();
  }

  async getUsers(request: QueryData) {
    const users = await this.user.getUsers(request);

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
}

const UserService = new User(UserDataLayer);

export default UserService;
