import TripSchedule from "../model/tripSchedules";
import { ClientSession, Model, PipelineStage } from "mongoose";
import DBLayer, {
    PaginationRequestData,
    QueryData,
    updateManyQuery,
} from "./shared";
import { ITripSchedule } from "../model/interfaces";

class TripScheduleRepository {
    private tripScheduleDBLayer: DBLayer<ITripSchedule>;

    constructor(model: Model<ITripSchedule>) {
        this.tripScheduleDBLayer = new DBLayer<ITripSchedule>(model);
    }

    async createTripSchedule(
        request: ITripSchedule,
        session?: ClientSession
    ): Promise<ITripSchedule[]> {

        const createdTripSchedule = await this.tripScheduleDBLayer.createDocs(
            [request],
            session
        );

        return createdTripSchedule;
    }

    async returnPaginatedTripSchedules(request: PaginationRequestData) {
        const paginatedTripSchedules = await this.tripScheduleDBLayer.paginateData(
            request
        );

        return paginatedTripSchedules;
    }

    async findTripScheduleById(request: QueryData) {
        const TripSchedule = await this.tripScheduleDBLayer.findDocById(request);
        return TripSchedule;
    }

    async updateTripSchedule(request: {
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
        const updatedTripSchedule = await this.tripScheduleDBLayer.updateDoc({
            docToUpdate: request.docToUpdate,
            updateData: request.updateData,
            options: request.options,
        });

        return updatedTripSchedule;
    }

    async updateManyTripSchedules(request: updateManyQuery<ITripSchedule>) {

        const result = await this.tripScheduleDBLayer.updateManyDocs(request);

        return result;
    }

    async bulkUpdateTripSchedule(request: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        operations: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options: any;
    }) {
        const result = await this.tripScheduleDBLayer.bulkWriteDocs(request);

        return result;
    }

    async aggregateTripSchedules(request: PipelineStage[]) {
        return await this.tripScheduleDBLayer.aggregateDocs(request);
    }

    async deleteTripSchedules(request: string[]) {
        return this.tripScheduleDBLayer.deleteDocs(request);
    }
}

export const TripScheduleDataLayer = new TripScheduleRepository(TripSchedule);

export default TripScheduleRepository;
