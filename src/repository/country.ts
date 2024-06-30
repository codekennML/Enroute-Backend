import Country from "../model/country";
import { ClientSession, Model } from "mongoose";
import DBLayer, {
  AggregateData,
  PaginationRequestData,
  QueryData,
  QueryId,
  updateManyQuery,
} from "./shared";
import { ICountry } from "../model/interfaces";
import { UpdateRequestData } from "../../types/types";

class CountryRepository {
  private CountryDBLayer: DBLayer<ICountry>;

  constructor(model: Model<ICountry>) {
    this.CountryDBLayer = new DBLayer<ICountry>(model);
  }

  async createCountry(
    request: ICountry,
    session?: ClientSession
  ): Promise<ICountry[]> {
    

    const createdCountries = await this.CountryDBLayer.createDocs([request], session);

    return createdCountries;
  }

  async returnPaginatedCountries(request: PaginationRequestData) {
    const paginatedCountries = await this.CountryDBLayer.paginateData(request);

    return paginatedCountries;
  }

  async findCountryById(request: QueryId) {
    const Country = await this.CountryDBLayer.findDocById(request);
    return Country;
  }

  async getCountries(request :QueryData){
    return await this.CountryDBLayer.findDocs(request)
  }

  async updateCountry(request:UpdateRequestData) {
    const updatedCountry = await this.CountryDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedCountry;
  }

  async updateManyCountries(request: updateManyQuery<ICountry>) {
    const result = await this.CountryDBLayer.updateManyDocs(request);

    return result;
  }

  async bulkUpdateCountries(request: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    operations: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any;
  }) {
    const result = await this.CountryDBLayer.bulkWriteDocs(request);

    return result;
  }

  async deleteCountries(request: string[]) {
    return this.CountryDBLayer.deleteDocs(request);
  }

  async aggregateData(request: AggregateData) {
    return await this.CountryDBLayer.aggregateData(request)
  }

}

export const CountryDataLayer = new CountryRepository(Country);

export default CountryRepository;
