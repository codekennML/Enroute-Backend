import { PaginationRequestData } from "./../repository/shared";
import { ClientSession } from "mongoose";
import { IUserPlaces } from "../model/interfaces";
import UserPlacesRepository, {
  UserPlacesDataLayer,
} from "../repository/userPlaces";
import { UpdateRequestData } from "../../types/types";

class UserPlacesService {
  private userPlaces: UserPlacesRepository;

  constructor(service: UserPlacesRepository) {
    this.userPlaces = service;
  }

  async createUserPlaces(request: IUserPlaces) {
    const UserPlaces = await this.userPlaces.createUserPlaces(request);

    return UserPlaces; //tThis should return an array of one UserPlaces only
  }

  async findUserPlaces(request: PaginationRequestData) {
    return this.userPlaces.returnPaginatedUserPlacess(request);
  }

  async updateUserPlaces(request: UpdateRequestData) {
    const updatedUserPlaces = await this.userPlaces.updateUserPlaces(request);
    return updatedUserPlaces;
  }

  async getUserPlacesById(
    UserPlacesId: string,
    select?: string,
    session?: ClientSession
  ) {
    const UserPlaces = await this.userPlaces.findUserPlacesById({
      query: { id: UserPlacesId },
      select,
      session,
    });

    return UserPlaces;
  }

  async deleteUserPlacess(request: string[]) {
    const deletedUserPlacess = await this.userPlaces.deleteUserPlacess(request);

    return deletedUserPlacess;
  }
}

export const UserPlacesServiceLayer = new UserPlacesService(
  UserPlacesDataLayer
);

export default UserPlacesService;
