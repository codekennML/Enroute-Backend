import { PaginationRequestData} from "./../repository/shared";
import { ClientSession, FilterQuery, PopulateOptions, Types } from "mongoose";
import { IPackageScheduleRequest } from "../model/interfaces";
import PackageScheduleRequestRepository, {
  PackageScheduleRequestDataLayer,
} from "../repository/packageScheduleRequest";
import { UpdateRequestData } from "../../types/types";

class PackageScheduleRequestService {
  private packageScheduleRequest: PackageScheduleRequestRepository;

  constructor(service: PackageScheduleRequestRepository) {
    this.packageScheduleRequest = service;
  }

  async createPackageScheduleRequest(
    request: IPackageScheduleRequest,
    session?: ClientSession
  ) {
    const PackageScheduleRequest =
      await this.packageScheduleRequest.createPackageScheduleRequest(
        request,
        session
      );

    return PackageScheduleRequest; //tThis should return an array of one PackageScheduleRequest only
  }

  async findPackageScheduleRequests(request: PaginationRequestData) {
    return this.packageScheduleRequest.returnPaginatedPackageScheduleRequests(
      request
    );
  }

  async updatePackageScheduleRequest(request: UpdateRequestData) {
    const updatedPackageScheduleRequest =
      await this.packageScheduleRequest.updatePackageScheduleRequest(request);
    return updatedPackageScheduleRequest;
  }

  async getPackageScheduleRequestById(
    PackageScheduleRequestId: string,
    populateQuery?: PopulateOptions[],
    select?: string,
    session?: ClientSession
  ) {
    const PackageScheduleRequest =
      await this.packageScheduleRequest.findPackageScheduleRequestById({
        query: new Types.ObjectId(PackageScheduleRequestId) ,
        select,
        populatedQuery: populateQuery,
        session,
      });

    return PackageScheduleRequest;
  }

  async deletePackageScheduleRequests(
    request: string[] | FilterQuery<IPackageScheduleRequest>
  ) {
    const deletedPackageScheduleRequests =
      await this.packageScheduleRequest.deletePackageScheduleRequests(request);

    return deletedPackageScheduleRequests;
  }
}

export const PackageScheduleRequestServiceLayer =
  new PackageScheduleRequestService(PackageScheduleRequestDataLayer);

export default PackageScheduleRequestService;
