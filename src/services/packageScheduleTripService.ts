import { AggregateData, PaginationRequestData } from "../repository/shared";
import { ClientSession, FilterQuery } from "mongoose";
import { IPackageSchedule } from "../model/interfaces";
import PackageScheduleRepository, {
  PackageScheduleDataLayer,
} from "../repository/packageSchedule";
import { UpdateRequestData } from "../../types/types";

class PackageScheduleService {
  private PackageSchedule: PackageScheduleRepository;

  constructor(service: PackageScheduleRepository) {
    this.PackageSchedule = service;
  }

  async createPackageSchedule(request: IPackageSchedule) {
    const PackageSchedule = await this.PackageSchedule.createPackageSchedule(
      request
    );

    return PackageSchedule; //tThis should return an array of one PackageSchedule only
  }

  async findPackageSchedules(request: PaginationRequestData) {
    return this.PackageSchedule.returnPaginatedPackageSchedules(request);
  }

  async updatePackageSchedule(request: UpdateRequestData) {
    const updatedPackageSchedule =
      await this.PackageSchedule.updatePackageSchedule(request);
    return updatedPackageSchedule;
  }

  async getPackageScheduleById(
    packageScheduleId: string,
    select?: string,
    session?: ClientSession
  ) {
    const PackageSchedule = await this.PackageSchedule.findPackageScheduleById({
      query: { id: packageScheduleId },
      select,
      session,
    });

    return PackageSchedule;
  }

  async deletePackageSchedules(request: string[] | FilterQuery<IPackageSchedule>) {
    const deletedPackageSchedules =
      await this.PackageSchedule.deletePackageSchedules(request);

    return deletedPackageSchedules;
  }

  async aggregatePackageSchedules(request : AggregateData){
    return await this.PackageSchedule.aggregatePackageSchedules(request)
  }
}

export const PackageScheduleServiceLayer = new PackageScheduleService(
  PackageScheduleDataLayer
);

export default PackageScheduleService;
