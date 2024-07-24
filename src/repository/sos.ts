import SOS from "../model/sos";
import { ClientSession, Model } from "mongoose";
import DBLayer, {
    AggregateData,
    PaginationRequestData,
    QueryData,
    QueryId,
    updateManyQuery,
} from "./shared";
import { ISOS } from "../model/interfaces";
import { UpdateRequestData } from "../../types/types";

class SOSRepository {
    private sosDBLayer: DBLayer<ISOS>;

    constructor(model: Model<ISOS>) {
        this.sosDBLayer = new DBLayer<ISOS>(model);
    }

    async createSOS(
        request: ISOS,
        session?: ClientSession
    ) {


        const createdSOS = await this.sosDBLayer.createDocs(
            [request],
            session
        );

        return createdSOS;
    }

    async returnPaginatedSOS(request: PaginationRequestData) {
        const paginatedSOS = await this.sosDBLayer.paginateData(
            request
        );

        return paginatedSOS;
    }

    async findSOSById(request: QueryId) {
        const sos = await this.sosDBLayer.findDocById(request);
        return sos;
    }

    async updateSOS(request: UpdateRequestData) {
        const updatedsos = await this.sosDBLayer.updateDoc({
            docToUpdate: request.docToUpdate,
            updateData: request.updateData,
            options: request.options,
        });

        return updatedsos;
    }

    async updateManySOS(request: updateManyQuery<ISOS>) {
        const result = await this.sosDBLayer.updateManyDocs(request);

        return result;
    }

    async bulkUpdateSOS(request: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        operations: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options: any;
    }) {
        const result = await this.sosDBLayer.bulkWriteDocs(request);

        return result;
    }

    async deleteSOS(request: string[]) {
        return this.sosDBLayer.deleteDocs(request);
    }

    async aggregateData(request: AggregateData) {
        return await this.sosDBLayer.aggregateData(request)
    }
}

export const sosDataLayer = new SOSRepository(SOS);

export default SOSRepository;
