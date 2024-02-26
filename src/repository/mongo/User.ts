import User, { IUserModel } from "../../model/user";
import DBLayer from "./shared";
import { ClientSession, Model } from "mongoose";
import { QueryData, PaginationRequestData } from "./shared";
import { SignupData } from "../../../types/types";

class UserRepository {
  private userDBLayer: DBLayer<IUserModel>;

  constructor(model: Model<IUserModel>) {
    this.userDBLayer = new DBLayer<IUserModel>(model);
  }

  async createUser(
    request: SignupData,
    session?: ClientSession
  ): Promise<IUserModel[]> {
    let createdUsers: IUserModel[] = [];

    createdUsers = await this.userDBLayer.createDocs([request], session);

    return createdUsers;
  }

  //This returns a non-paginated array  of users
  async getUsers(request: QueryData) {
    const users = await this.userDBLayer.findDocs(request);
    return users;
  }

  async returnPaginatedUsers(request: PaginationRequestData) {
    const paginatedUsers = await this.userDBLayer.paginateData(request);

    return paginatedUsers;
  }

  async updateUser(request: {
    docToUpdate: { [key: string]: Record<"$eq", string> };
    updateData: { [k: string]: string | object | boolean };
    options: {
      new?: boolean;
      session?: ClientSession;
      select?: string;
      upsert?: boolean;
    };
  }) {
    const updatedUser = await this.userDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedUser;
  }
}

export const UserDataLayer = new UserRepository(User);

export default UserRepository;
