import Tickets from "../model/tickets";
import { ClientSession, Model } from "mongoose";
import DBLayer, {
  PaginationRequestData,
  QueryData,
  updateManyQuery,
} from "./shared";
import { ITickets } from "../model/interfaces";

class TicketsRepository {
  private TicketsDBLayer: DBLayer<ITickets>;

  constructor(model: Model<ITickets>) {
    this.TicketsDBLayer = new DBLayer<ITickets>(model);
  }

  async createTickets(
    request: ITickets,
    session?: ClientSession
  ): Promise<ITickets[]> {
    let createdTicketss: ITickets[] = [];

    createdTicketss = await this.TicketsDBLayer.createDocs([request], session);

    return createdTicketss;
  }

  async returnPaginatedTickets(request: PaginationRequestData) {
    const paginatedTicketss = await this.TicketsDBLayer.paginateData(request);

    return paginatedTicketss;
  }

  async findTicketById(request: QueryData) {
    const Tickets = await this.TicketsDBLayer.findDocById(request);
    return Tickets;
  }

  async updateTickets(request: {
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
    const updatedTickets = await this.TicketsDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedTickets;
  }

  async updateManyTicketss(request: updateManyQuery<ITickets>) {
    const result = await this.TicketsDBLayer.updateManyDocs(request);

    return result;
  }

  async bulkUpdateTickets(request: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    operations: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any;
  }) {
    const result = await this.TicketsDBLayer.bulkWriteDocs(request);

    return result;
  }

  async deleteTickets(request: string[]) {
    return this.TicketsDBLayer.deleteDocs(request);
  }
}

export const TicketsDataLayer = new TicketsRepository(Tickets);

export default TicketsRepository;
