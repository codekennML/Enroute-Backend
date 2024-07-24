import PackageScheduleRequest from "../model/packageScheduleRequest";
import { ClientSession, FilterQuery, Model } from "mongoose";
import DBLayer, {
  PaginationRequestData,
  QueryData,
  QueryId,
  updateManyQuery,
} from "./shared";
import { IPackageScheduleRequest } from "../model/interfaces";
import { UpdateRequestData } from "../../types/types";

class PackageScheduleRequestRepository {
  private PackageScheduleRequestDBLayer: DBLayer<IPackageScheduleRequest>;

  constructor(model: Model<IPackageScheduleRequest>) {
    this.PackageScheduleRequestDBLayer = new DBLayer<IPackageScheduleRequest>(
      model
    );
  }

  async createPackageScheduleRequest(
    request: IPackageScheduleRequest,
    session?: ClientSession
  ) {
    const createdPackageScheduleRequests =
      await this.PackageScheduleRequestDBLayer.createDocs([request], session);

    return createdPackageScheduleRequests;
  }

  async returnPaginatedPackageScheduleRequests(request: PaginationRequestData) {
    const paginatedPackageScheduleRequests =
      await this.PackageScheduleRequestDBLayer.paginateData(request);

    return paginatedPackageScheduleRequests;
  }

  async findPackageScheduleRequestById(request: QueryId) {
    const PackageScheduleRequest =
      await this.PackageScheduleRequestDBLayer.findDocById(request);
    return PackageScheduleRequest;
  }

  async updatePackageScheduleRequest(request: UpdateRequestData) {
    const updatedPackageScheduleRequest =
      await this.PackageScheduleRequestDBLayer.updateDoc({
        docToUpdate: request.docToUpdate,
        updateData: request.updateData,
        options: request.options,
      });

    return updatedPackageScheduleRequest;
  }

  async updateManyPackageScheduleRequests(
    request: updateManyQuery<IPackageScheduleRequest>
  ) {
    const result = await this.PackageScheduleRequestDBLayer.updateManyDocs(
      request
    );

    return result;
  }

  //   async bulkUpdatePackageScheduleRequest(request: {
  //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //     operations: any;
  //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //     options: any;
  //   }) {
  //     const result = await this.PackageScheduleRequestDBLayer.bulkWriteDocs(
  //       request
  //     );

  //     return result;
  //   }

  async deletePackageScheduleRequests(
    request: string[] | FilterQuery<IPackageScheduleRequest>
  ) {
    return this.PackageScheduleRequestDBLayer.deleteDocs(request);
  }
}

export const PackageScheduleRequestDataLayer =
  new PackageScheduleRequestRepository(PackageScheduleRequest);

export default PackageScheduleRequestRepository;
