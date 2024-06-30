import { PaginationRequestData } from "./../repository/shared";
import { ClientSession } from "mongoose";
import { IRating } from "../model/interfaces";
import RatingRepository, {
  ratingDataLayer,
} from "../repository/rating";
import { UpdateRequestData } from "../../types/types";
import { retryTransaction } from "../utils/helpers/retryTransaction";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";

class ratingService {

  private rating: RatingRepository;

  constructor(service: RatingRepository) {
    this.rating = service;
  }

  async createRating(request: IRating) {
    
    const rating = await this.rating.createRating(request);

    return rating; //tThis should return an array of one rating only
  }

  async findRatings(request: PaginationRequestData) {
    return this.rating.returnPaginatedRatings(request);
  }

  async updateRating(request: UpdateRequestData) {
    const updatedrating = await this.rating.updateRating(request);
    return updatedrating;
  }

  async getRatingById(
    ratingId: string,
    select?: string,
    session?: ClientSession
  ) {
    const rating = await this.rating.findRatingById({
      query: { id: ratingId },
      select,
      session,
    });

    return rating;
  }

  async deleteRatings(request: string[]) {
    const deletedratings = await this.rating.deleteRatings(request);

    return deletedratings;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async bulkWriteRatings(request: any, session: ClientSession) {
    const { operations } = request;
    const result = await this.rating.bulkUpdateRating({
      operations,
      options: { session },
    });

    return result;
  }

  async bulkAddrating(request: IRating[]) {
    //@ts-expect-error //This is a bulkwrite
    //TODO Set the correct type here
    const operations = [];

    request.map((rating) => {
      operations.push({
        insertOne: {
          document: {
            ...rating,
          },
        },
      });
    });

    const response = await retryTransaction(this.bulkWriteRatings, 1, {
      //@ts-expect-error this operation is a bulkwrite
      operations,
    });

    if (!response)
      throw new AppError(
        getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        StatusCodes.INTERNAL_SERVER_ERROR
      );
  }
}

export const ratingServiceLayer = new ratingService(
  ratingDataLayer
);

export default ratingService;
