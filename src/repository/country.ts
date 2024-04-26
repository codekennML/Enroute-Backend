import Country, { CountryModel } from "../model/country";
import { ClientSession, Model } from "mongoose";
import DBLayer, {
  PaginationRequestData,
  QueryData,
  updateManyQuery,
} from "./shared";
import { ICountry } from "../model/interfaces";

class CountryRepository {
  private CountryDBLayer: DBLayer<CountryModel>;

  constructor(model: Model<CountryModel>) {
    this.CountryDBLayer = new DBLayer<CountryModel>(model);
  }

  async createCountry(
    request: ICountry,
    session?: ClientSession
  ): Promise<CountryModel[]> {
    let createdCountrys: CountryModel[] = [];

    createdCountrys = await this.CountryDBLayer.createDocs([request], session);

    return createdCountrys;
  }

  async returnPaginatedCountries(request: PaginationRequestData) {
    const paginatedCountrys = await this.CountryDBLayer.paginateData(request);

    return paginatedCountrys;
  }

  async findCountryById(request: QueryData) {
    const Country = await this.CountryDBLayer.findDocById(request);
    return Country;
  }

  async updateCountry(request: {
    docToUpdate: { [key: string]: Record<"$eq", string> };
    updateData: { [k: string]: string | object | boolean };
    options: {
      new?: boolean;
      session?: ClientSession;
      select?: string;
      upsert?: boolean;
      includeResultMetadata?: boolean;
    };
  }) {
    const updatedCountry = await this.CountryDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedCountry;
  }

  async updateManyCountries(request: updateManyQuery<CountryModel>) {
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
}

export const CountryDataLayer = new CountryRepository(Country);

export default CountryRepository;
