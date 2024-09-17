import { AggregateData, PaginationRequestData, QueryData } from "./../repository/shared";
import { ClientSession, Types } from "mongoose";
import { ICountry } from "../model/interfaces";
import CountryRepository, { CountryDataLayer } from "../repository/country";
import { UpdateRequestData } from "../../types/types";

class CountryService {
  private country: CountryRepository;

  constructor(service: CountryRepository) {
    this.country = service;
  }

  async createCountry(request: ICountry) {
    const Country = await this.country.createCountry(request);

    return Country; //tThis should return an array of one Country only
  }

  async aggregateCountries(request: AggregateData) {
    return await this.country.aggregateData(request)
  }

  async findCountries(request: PaginationRequestData) {
    return this.country.returnPaginatedCountries(request);
  }

  async getCountries(request: QueryData) {
    const result = await this.country.getCountries(request)

    return result
  }

  async updateCountry(request: UpdateRequestData) {
    const updatedCountry = await this.country.updateCountry(request);
    return updatedCountry;
  }

  async getCountryById(
    countryId: string,
    select?: string,
    session?: ClientSession
  ) {
    const Country = await this.country.findCountryById({
      query: new Types.ObjectId(countryId),
      select,
      session,
    });

    return Country;
  }

  async deleteCountries(request: string[]) {
    const deletedCountrys = await this.country.deleteCountries(request);

    return deletedCountrys;
  }
}

export const CountryServiceLayer = new CountryService(CountryDataLayer);

export default CountryService;
