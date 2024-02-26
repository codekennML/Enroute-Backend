import { Model, ClientSession } from "mongoose";
import { IUserAccess } from "../../model/interfaces";

import IUserAccessModel, { UserAccessLogs } from "../../model/useraccesstokens";
import DBLayer, { PaginationRequestData, QueryData } from "./shared";

class UserAccessRepository {
  private accessDBLayer: DBLayer<IUserAccessModel>;

  constructor(model: Model<IUserAccessModel>) {
    this.accessDBLayer = new DBLayer<IUserAccessModel>(model);
  }

  async createAccess(
    request: IUserAccess,
    session?: ClientSession
  ): Promise<IUserAccessModel[]> {
    let newAccess: IUserAccessModel[] = [];

    newAccess = await this.accessDBLayer.createDocs([request], session);

    return newAccess;
  }

  async findAccess(request: QueryData) {
    const accesss = await this.accessDBLayer.findDocs(request);

    return accesss;
  }

  async returnPaginatedAccesss(request: PaginationRequestData) {
    const paginatedUsers = await this.accessDBLayer.paginateData(request);

    return paginatedUsers;
  }

  async updateAccess(request: {
    docToUpdate: { [key: string]: Record<"$eq", string> };
    updateData: { [k: string]: string | object | boolean | undefined };
    options: {
      new?: boolean;
      session?: ClientSession;
      select?: string;
      upsert?: boolean;
    };
  }) {
    const updatedUser = await this.accessDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedUser;
  }
}

export const userAccessDataLayer = new UserAccessRepository(UserAccessLogs);

export default UserAccessRepository;
