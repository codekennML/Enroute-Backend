import UserRepository, { UserDataLayer } from "../repository/user";
import { ClientSession, Types } from "mongoose";
import { UpdateRequestData } from "../../types/types";
import { AggregateData, PaginationRequestData, QueryData } from "../repository/shared";
import { IUser } from "../model/interfaces";

class User {

  private user: UserRepository;

  constructor(dataLayer: UserRepository) {
    this.user = dataLayer;
  }

  async createUser(
    userData: Required<Pick<IUser, "firstName" | "lastName" | "email">>
  ) {
    const user = await this.user.createUser(userData);

    return user;
  }
  //This returns a paginated result based on cursors supplied
  async findUsers(request: PaginationRequestData) {
    return this.user.returnPaginatedUsers(request);
  }

  async getUsers(request: QueryData) {
    const users = await this.user.getUsers(request);
    return users;
  }

  async getUserById(userId: string, select: string, session?: ClientSession) {
    // const verificationDataArray = [
    //   "vehicle",
    //   "identification",
    //   "selfie",
    //   "license",
    //   "lasraa",
    // ];

    //always include the adddress
    // const populateQuery: PopulateOptions[] = [
    //   {
    //     path: "address",
    //     model: Documents,
    //     populate: {
    //       path: "documents",
    //       select: "imageUrl status isVerified ",
    //       model: Documents,
    //     },
    //   },
    // ];

    // for (const key of verificationDataArray) {
    //   if (select.includes(key)) {
    //     populateQuery.push({
    //       path: key,
    //       model: Documents,
    //     });
    //   }
    // }

    const user = await this.user.getUserById({
      query: new Types.ObjectId(userId),
      select,
      session,

    });

    return user;
  }

  updateUser = async (request: UpdateRequestData) => {
    console.log("RUNNINGGGNG", request)
    console.log(this.user)
    const updatedUser = await this.user.updateUser(request);
    console.log("VAMOS")
    return updatedUser;

  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async bulkUpdateUser(request: any, session?: ClientSession) {
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

  async aggregateUsers(request: AggregateData) {
    return await this.user.aggregateUsers(request)
  }
}

export const UserServiceLayer = new User(UserDataLayer);

export default User;
