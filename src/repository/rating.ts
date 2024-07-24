import Rating from "../model/rating";
import { ClientSession, Model } from "mongoose";
import DBLayer, {
    AggregateData,
    PaginationRequestData,
    QueryData,
    QueryId,
    updateManyQuery,
} from "./shared";
import { IRating } from "../model/interfaces";
import { UpdateRequestData } from "../../types/types";

class RatingRepository {
    private ratingDBLayer: DBLayer<IRating>;

    constructor(model: Model<IRating>) {
        this.ratingDBLayer = new DBLayer<IRating>(model);
    }

    async createRating(
        request: IRating,
        session?: ClientSession
    ): Promise<IRating[]> {


       const createdRatings = await this.ratingDBLayer.createDocs(
            [request],
            session
        );

        return createdRatings;
    }

    async returnPaginatedRatings(request: PaginationRequestData) {
        const paginatedratings = await this.ratingDBLayer.paginateData(
            request
        );

        return paginatedratings;
    }

    async findRatingById(request: QueryId) {
        const rating = await this.ratingDBLayer.findDocById(request);
        return rating;
    }

    async updateRating(request: UpdateRequestData) {
        const updatedRating = await this.ratingDBLayer.updateDoc({
            docToUpdate: request.docToUpdate,
            updateData: request.updateData,
            options: request.options,
        });

        return updatedRating;
    }

    async updateManyRatings(request: updateManyQuery<IRating>) {
        const result = await this.ratingDBLayer.updateManyDocs(request);

        return result;
    }

    async bulkUpdateRating(request: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        operations: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options: any;
    }) {
        const result = await this.ratingDBLayer.bulkWriteDocs(request);

        return result;
    }

    async deleteRatings(request: string[]) {
        return this.ratingDBLayer.deleteDocs(request);
    }

    async aggregateData(request: AggregateData) {
        return await this.ratingDBLayer.aggregateData(request)
    }
}

export const ratingDataLayer = new RatingRepository(Rating);

export default RatingRepository;
