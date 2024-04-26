import { Model, ClientSession } from "mongoose";
import { IOtp } from "../model/interfaces";
import IOtpModel, { Otp } from "../model/otp";
import DBLayer, { PaginationRequestData, QueryData } from "./shared";
import { UpdateRequestData } from "../../types/types";

class OtpRepository {
  private otpDBLayer: DBLayer<IOtpModel>;

  constructor(model: Model<IOtpModel>) {
    this.otpDBLayer = new DBLayer<IOtpModel>(model);
  }

  async createOTP(
    request: IOtp,
    session?: ClientSession
  ): Promise<IOtpModel[]> {
    let newOtp: IOtpModel[] = [];

    newOtp = await this.otpDBLayer.createDocs([request], session);

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
}

export const otpDataLayer = new OtpRepository(Otp);

export default OtpRepository;
