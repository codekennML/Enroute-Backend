import { Model, ClientSession } from "mongoose";
import { IRoute } from "../model/interfaces";
import RouteModel, { Route } from "../model/route";
import DBLayer, { PaginationRequestData, updateManyQuery } from "./shared";
import { UpdateRequestData } from "../../types/types";

class RouteRepository {
  private routesDBLayer: DBLayer<RouteModel>;

  constructor(model: Model<RouteModel>) {
    this.routesDBLayer = new DBLayer<RouteModel>(model);
  }

  async createRoute(
    request: IRoute,
    session?: ClientSession
  ): Promise<RouteModel[]> {
    let newRoute: RouteModel[] = [];

    try {
      newRoute = await this.routesDBLayer.createDocs([request], session);
    } catch (error) {
      console.error(error);
    }

    return newRoute;
  }

  async returnPaginatedRoutes(request: PaginationRequestData) {
    const paginatedUsers = await this.routesDBLayer.paginateData(request);

    return paginatedUsers;
  }

  async updateRoutes(request: UpdateRequestData) {
    const updatedDocs = await this.routesDBLayer.updateDoc(request);

    return updatedDocs;
  }

  async updateManyRideRequests(request: updateManyQuery<RouteModel>) {
    const result = await this.routesDBLayer.updateManyDocs(request);

    return result;
  }
}

export const routesDataLayer = new RouteRepository(Route);

export default RouteRepository;
