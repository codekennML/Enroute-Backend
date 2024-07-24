import { PaginationRequestData } from "./../repository/shared";
import { ClientSession, Types } from "mongoose";
import { ITripSchedule } from "../model/interfaces";
import tripScheduleRepository, {
} from "../repository/tripSchedules";
import { TripScheduleDataLayer } from "../repository/tripSchedules";
import { UpdateRequestData } from "../../types/types";
import { retryTransaction } from "../utils/helpers/retryTransaction";
import { PipelineStage } from "mongoose";

class TripScheduleService {

    private tripSchedule: tripScheduleRepository;

    constructor(service: tripScheduleRepository) {
        this.tripSchedule = service;
    }

    async createTripSchedule(request: ITripSchedule) {
        const tripSchedule = await this.tripSchedule.createTripSchedule(request);

        return tripSchedule; //tThis should return an array of one tripSchedule only
    }

    async findTripSchedules(request: PaginationRequestData) {
        return this.tripSchedule.returnPaginatedTripSchedules(request);
    }

    async updateTripSchedule(request: UpdateRequestData) {
        const updatedtripSchedule = await this.tripSchedule.updateTripSchedule(request);
        return updatedtripSchedule;
    }

    async getTripScheduleById(
        tripScheduleId: string,
        select?: string,
        session?: ClientSession
    ) {
        const tripSchedule = await this.tripSchedule.findTripScheduleById({
            query: new Types.ObjectId (tripScheduleId) ,
            select,
            session,
        });

        return tripSchedule;
    }

    async deleteTripSchedules(request: string[]) {
        const deletedtripSchedules = await this.tripSchedule.deleteTripSchedules(request);

        return deletedtripSchedules;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async bulkWriteTripSchedules(request: any, session: ClientSession) {
        const { operations } = request;
        const result = await this.tripSchedule.bulkUpdateTripSchedule({
            operations,
            options: { session },
        });

        return result;
    }

    async bulkAddTripSchedule(request: ITripSchedule[]) {
        //@ts-expect-error //This is a bulkwrite
        //TODO Set the correct type here
        const operations = [];

        request.map((tripSchedule) => {
            operations.push({
                insertOne: {
                    document: {
                        ...tripSchedule,
                    },
                },
            });
        });

        const response = await retryTransaction(this.bulkWriteTripSchedules, 1, {
            //@ts-expect-error this operation is a bulkwrite
            operations,
        });

        if (!response) return

    }

    async aggregateTripSchedules(request: PipelineStage[]) {
        return await this.tripSchedule.aggregateTripSchedules(request);
    }



}

export const tripScheduleServiceLayer = new TripScheduleService(
    TripScheduleDataLayer
);

export default TripScheduleService;
