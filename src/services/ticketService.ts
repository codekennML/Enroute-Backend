import { PaginationRequestData } from "./../repository/shared";
import { ClientSession } from "mongoose";
import { ITickets } from "../model/interfaces";
import TicketsRepository, { TicketsDataLayer } from "../repository/tickets";
import { UpdateRequestData } from "../../types/types";

class TicketsService {
  private tickets: TicketsRepository;

  constructor(service: TicketsRepository) {
    this.tickets = service;
  }

  async createtickets(request: ITickets) {
    const Tickets = await this.tickets.createTickets(request);

    return Tickets; //tThis should return an array of one Tickets only
  }

  async findticketss(request: PaginationRequestData) {
    return this.tickets.returnPaginatedTickets(request);
  }

  async updatetickets(request: UpdateRequestData) {
    const updatedtickets = await this.tickets.updateTickets(request);
    return updatedtickets;
  }

  async getTicketById(
    TicketsId: string,
    select?: string,
    session?: ClientSession
  ) {
    const tickets = await this.tickets.findTicketById({
      query: { id: TicketsId },
      select,
      session,
    });

    return tickets;
  }

  async deleteticketss(request: string[]) {
    const deletedticketss = await this.tickets.deleteTickets(request);

    return deletedticketss;
  }
}

export const TicketsServiceLayer = new TicketsService(TicketsDataLayer);

export default TicketsService;
