import { Model, ClientSession } from "mongoose";
import { IOtp } from "../model/interfaces";
import { Otp } from "../model/otp";
import DBLayer, { AggregateData, PaginationRequestData, QueryData } from "./shared";
import { UpdateRequestData } from "../../types/types";

class OtpRepository {
  private otpDBLayer: DBLayer<IOtp>;

  constructor(model: Model<IOtp>) {
    this.otpDBLayer = new DBLayer<IOtp>(model);
  }

  async createOTP(
    request: IOtp,
    session?: ClientSession
  ) {
  
    const newOtp = await this.otpDBLayer.createDocs([request], session);

    return newOtp;
  }

  async findOtp(request: QueryData) {
    const otp = await this.otpDBLayer.findDocs(request);

    return otp;
  }

  async returnPaginatedOtp(request: PaginationRequestData) {
    const paginatedOtps = await this.otpDBLayer.paginateData(request);

    return paginatedOtps;
  }

  async updateOtp(request: UpdateRequestData) {
    const updatedDocs = await this.otpDBLayer.updateDoc(request);

    return updatedDocs;
  }
  async aggregateOtp(request : AggregateData){
    return await this.otpDBLayer.aggregateData(request)
  }
}

export const otpDataLayer = new OtpRepository(Otp);

export default OtpRepository;
