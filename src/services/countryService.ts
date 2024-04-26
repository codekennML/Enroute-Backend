import { PaginationRequestData } from "./../repository/shared";
import { ClientSession } from "mongoose";
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

  async findCountries(request: PaginationRequestData) {
    return this.country.returnPaginatedCountries(request);
  }

  async updateCountry(request: UpdateRequestData) {
    const updatedCountry = await this.country.updateCountry(request);
    return updatedCountry;
  }

  async getCountryById(
    CountryId: string,
    select?: string,
    session?: ClientSession
  ) {
    const Country = await this.country.findCountryById({
      query: { id: CountryId },
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
