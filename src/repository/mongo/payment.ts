import { IPay } from "../../model/interfaces";
import DBLayer from "./shared";
import { UpdateRequestData } from "../../../types/types";
import Pay, { IPayModel } from "../../model/payments";
import { ClientSession, Model, PipelineStage } from "mongoose";
import { QueryData, PaginationRequestData } from "./shared";

class PaymentRepository {
  private payDBLayer: DBLayer<IPayModel>;

  constructor(model: Model<IPayModel>) {
    this.payDBLayer = new DBLayer<IPayModel>(model);
  }

  async createPayment(
    request: IPay,
    session?: ClientSession
  ): Promise<IPayModel[]> {
    let newRide: IPayModel[] = [];

    try {
      newRide = await this.payDBLayer.createDocs([request], session);
    } catch (error) {
      console.error(error);
    }

    return newRide;
  }

  async findPayments(request: QueryData) {
    const pay = await this.payDBLayer.findDocs(request);

    return pay;
  }

  async returnPaginatedPayments(request: PaginationRequestData) {
    const paginatedUsers = await this.payDBLayer.paginateData(request);

    return paginatedUsers;
  }

  async updatePayment(request: UpdateRequestData) {
    const updatedDocs = await this.payDBLayer.updateDoc(request);

    return updatedDocs;
  }

  async aggregatePayment(request: PipelineStage[]) {
    return await this.payDBLayer.aggregateDocs(request);
  }

  //   async updateManyPayments(request: UpdateManyData) {
  //     const updatedDocs = await this.payDBLayer.updateManyDocs(request);
  //     return updatedDocs;
  //   }
  // }
}
export const payDataLayer = new PaymentRepository(Pay);

export default PaymentRepository;
