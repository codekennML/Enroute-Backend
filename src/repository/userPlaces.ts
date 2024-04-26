import UserPlaces from "../model/userPlaces";
import { ClientSession, Model } from "mongoose";
import DBLayer, {
  PaginationRequestData,
  QueryData,
  updateManyQuery,
} from "./shared";
import { IUserPlaces } from "../model/interfaces";

class UserPlacesRepository {
  private UserPlacesDBLayer: DBLayer<IUserPlaces>;

  constructor(model: Model<IUserPlaces>) {
    this.UserPlacesDBLayer = new DBLayer<IUserPlaces>(model);
  }

  async createUserPlaces(
    request: IUserPlaces,
    session?: ClientSession
  ): Promise<IUserPlaces[]> {
    let createdUserPlacess: IUserPlaces[] = [];

    createdUserPlacess = await this.UserPlacesDBLayer.createDocs(
      [request],
      session
    );

    return createdUserPlacess;
  }

  async returnPaginatedUserPlacess(request: PaginationRequestData) {
    const paginatedUserPlacess = await this.UserPlacesDBLayer.paginateData(
      request
    );

    return paginatedUserPlacess;
  }

  async findUserPlacesById(request: QueryData) {
    const UserPlaces = await this.UserPlacesDBLayer.findDocById(request);
    return UserPlaces;
  }

  async updateUserPlaces(request: {
    docToUpdate: { [key: string]: Record<"$eq", string> };
    updateData: { [k: string]: string | object | boolean };
    options: {
      new?: boolean;
      session?: ClientSession;
      select?: string;
      upsert?: boolean;
      includeResultMetadata?: boolean;
    };
  }) {
    const updatedUserPlaces = await this.UserPlacesDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedUserPlaces;
  }

  async updateManyUserPlacess(request: updateManyQuery<IUserPlaces>) {
    const result = await this.UserPlacesDBLayer.updateManyDocs(request);

    return result;
  }

  async bulkUpdateUserPlaces(request: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    operations: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any;
  }) {
    const result = await this.UserPlacesDBLayer.bulkWriteDocs(request);

    return result;
  }

  async deleteUserPlacess(request: string[]) {
    return this.UserPlacesDBLayer.deleteDocs(request);
  }
}

export const UserPlacesDataLayer = new UserPlacesRepository(UserPlaces);

export default UserPlacesRepository;
