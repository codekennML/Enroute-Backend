import User from "../model/user";
import { ClientSession, Model } from "mongoose";
import DBLayer, { QueryData, PaginationRequestData, AggregateData, QueryId } from "./shared";
import { SignupData, UpdateRequestData } from "../../types/types";
import { IUser } from "../model/interfaces";

class UserRepository {
  private userDBLayer: DBLayer<IUser>;

  constructor(model: Model<IUser>) {
    this.userDBLayer = new DBLayer<IUser>(model);
  }

  async createUser(request: SignupData, session?: ClientSession) {


    const createdUsers = await this.userDBLayer.createDocs([request], session);

    return createdUsers;
  }

  //This returns a non-paginated array  of users
  async getUsers(request: QueryData) {
    const users = await this.userDBLayer.findDocs(request);
    return users;
  }

  async getUserById(request: QueryId) {
    const user = await this.userDBLayer.findDocById(request);

    return user;
  }

  async returnPaginatedUsers(request: PaginationRequestData) {
    const paginatedUsers = await this.userDBLayer.paginateData(request);

    return paginatedUsers;
  }

  async updateUser(request: UpdateRequestData) {
    const updatedUser = await this.userDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedUser;
  }

  async bulkUpdateUsers(request: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    operations: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any;
  }) {
    const result = await this.userDBLayer.bulkWriteDocs(request);

    return result;
  }

  async aggregateUsers(request: AggregateData) {
    return await this.userDBLayer.aggregateData(request)
  }

}

export const UserDataLayer = new UserRepository(User);

export default UserRepository;
