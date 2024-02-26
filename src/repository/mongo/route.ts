import { Model, ClientSession, PipelineStage } from "mongoose";
import { IRoute } from "../../model/interfaces";
import IRouteModel, { Route } from "../../model/route";
import DBLayer, { PaginationRequestData, QueryData } from "./shared";
import { UpdateRequestData } from "../../../types/types";

class RouteRepository {
  private routesDBLayer: DBLayer<IRouteModel>;

  constructor(model: Model<IRouteModel>) {
    this.routesDBLayer = new DBLayer<IRouteModel>(model);
  }

  async createRoute(
    request: IRoute,
    session?: ClientSession
  ): Promise<IRouteModel[]> {
    let newRoute: IRouteModel[] = [];

    try {
      newRoute = await this.routesDBLayer.createDocs([request], session);
    } catch (error) {
      console.error(error);
    }

    return newRoute;
  }

  async findRoute(request: QueryData) {
    const routes = await this.routesDBLayer.findDocs(request);

    return routes;
  }

  async sampleRouteData(query: PipelineStage[]) {
    const sampleRoutesArray = await this.routesDBLayer.sampleData(query);

    return sampleRoutesArray;
  }

  async returnPaginatedRoutes(request: PaginationRequestData) {
    const paginatedUsers = await this.routesDBLayer.paginateData(request);

    return paginatedUsers;
  }

  async updateRoutes(request: UpdateRequestData) {
    const updatedDocs = await this.routesDBLayer.updateDoc(request);

    return updatedDocs;
  }
}

export const routesDataLayer = new RouteRepository(Route);

export default RouteRepository;
