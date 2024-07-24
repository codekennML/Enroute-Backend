import PackageSchedule from "../model/packageSchedule";
import { ClientSession, FilterQuery, Model } from "mongoose";
import DBLayer, {
  AggregateData,
  PaginationRequestData,
  QueryData,
  QueryId,
  updateManyQuery,
} from "./shared";
import { IPackageSchedule } from "../model/interfaces";
import { UpdateRequestData } from "../../types/types";

class PackageScheduleRepository {
  private packageScheduleDBLayer: DBLayer<IPackageSchedule>;

  constructor(model: Model<IPackageSchedule>) {
    this.packageScheduleDBLayer = new DBLayer<IPackageSchedule>(model);
  }

  async createPackageSchedule(
    request: IPackageSchedule,
    session?: ClientSession
  ): Promise<IPackageSchedule[]> {

 const createdPackageSchedules = await this.packageScheduleDBLayer.createDocs(
      [request],
      session
    );

    return createdPackageSchedules;
  }

  async returnPaginatedPackageSchedules(request: PaginationRequestData) {
    const paginatedPackageSchedules =
      await this.packageScheduleDBLayer.paginateData(request);

    return paginatedPackageSchedules;
  }

  async findPackageScheduleById(request: QueryId) {
    const PackageSchedule = await this.packageScheduleDBLayer.findDocById(
      request
    );
    return PackageSchedule;
  }

  async updatePackageSchedule(request: UpdateRequestData) {
    const updatedPackageSchedule = await this.packageScheduleDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedPackageSchedule;
  }

  async updateManyPackageSchedules(request: updateManyQuery<IPackageSchedule>) {
    const result = await this.packageScheduleDBLayer.updateManyDocs(request);

    return result;
  }

  async bulkUpdatePackageSchedule(request: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    operations: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any;
  }) {
    const result = await this.packageScheduleDBLayer.bulkWriteDocs(request);

    return result;
  }

  async deletePackageSchedules(
    request: string[] | FilterQuery<IPackageSchedule>
  ) {
    return this.packageScheduleDBLayer.deleteDocs(request);
  }
  async aggregatePackageSchedules(request: AggregateData) {
    return await this.packageScheduleDBLayer.aggregateData(request)
  }

}

export const PackageScheduleDataLayer = new PackageScheduleRepository(
  PackageSchedule
);

export default PackageScheduleRepository;
