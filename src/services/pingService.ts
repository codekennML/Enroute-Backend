import { Ping } from "../../types/types";
import { scyllaDataLayer } from "../repository/scylla/shared";

class PingService {
  //For drivers only
  async sendCachePing(cacheData: Ping.DriverCachePing) {
    const query = `INSERT INTO cachePings
        (
             tripId, availableSeats, carId, driverId, coordinates, createdAt, date , cellId
        ) VALUES(
        ?,?,?,?,?,?, ?,?
        ) 
        `;

    const params = Object.values(cacheData);

    const response = await scyllaDataLayer.executeDataQuery(query, params, {
      prepare: true,
    });

    return response;
  }

  async sendDriverPing(pingData: Ping.DriverPing) {
    const query = `INSERT INTO driverPings
        (
             tripId, availableSeats, carId, driverId, coordinates, createdAt, date,
        ) VALUES(
        ?,?,?,?,?,?, ?
        ) 
        `;

    const params = Object.values(pingData);

    const response = await scyllaDataLayer.executeDataQuery(query, params, {
      prepare: true,
    });

    return response;
  }

  async sendRiderPing(pingData: Ping.RiderPing) {
    const query = `INSERT INTO riderPings 
        (
        rideId, tripId carId, riderId, coordinates, createdAt, date,
        ) VALUES(
        ?,?,?,?,?,?,?
        ) 
        `;

    const params = Object.values(pingData);

    const response = await scyllaDataLayer.executeDataQuery(query, params, {
      prepare: true,
    });

    return response;
  }

  async getCachePings(
    cellId: string,
    date: Date = new Date(),
    timeframe: { from?: Date; to?: Date },
    seats = 0,
    cursor?: Date
  ) {
    const pageSize = 50;

    const query = `
       SELECT * 
       FROM cachePings 
       WHERE cellId = ?
         ${date ? `AND date = ?` : ""} 
         ${timeframe?.from ? `AND createdAt > ?` : ""} 
         ${timeframe?.to ? `AND createdAt < ?` : ""} 
         ${seats ? `AND available >= ?` : ""} 
         ${cursor ? `AND createdAt > ?` : ""} 
         ORDERBY createdAT DESC
         LIMIT ?
    `;

    const params = [cellId];
    if (date) params.push(date.toString());
    if (timeframe?.from) params.push(timeframe.from.toString());
    if (timeframe?.to) params.push(timeframe.to.toString());
    if (seats) params.push(seats.toString());
    if (cursor) params.push(cursor.toISOString());
    params.push(pageSize.toString()); //Page Size

    const response = await scyllaDataLayer.executeDataQuery(query, params);

    return response;
  }

  async getRiderPings(rideId: string, date: Date, cursor: Date, limit: number) {
    const query = `
       SELECT * 
       FROM riderPings 
       WHERE rideId = ?
       ${cursor ? `AND createdAt > ?` : ""} 
         ORDERBY createdAT DESC
         ${limit ? `LIMIT ?` : ""}
    `;

    const params = [rideId];
    if (date) params.push(date.toString());
    if (cursor) params.push(cursor.toISOString());
    if (limit) params.push(limit.toString()); //Page Size

    const response = await scyllaDataLayer.executeDataQuery(query, params);

    return response;
  }

  async getDriverPings(
    rideId: string,
    date: Date,
    cursor: Date,
    limit: number
  ) {
    const query = `
       SELECT * 
       FROM driverPings 
       WHERE tripId = ?
       ${cursor ? `AND createdAt > ?` : ""} 
        ORDERBY createdAT DESC
        ${limit ? `LIMIT ?` : ""}
    `;

    const params = [rideId];
    if (date) params.push(date.toString());
    if (cursor) params.push(cursor.toISOString());
    if (limit) params.push(limit.toString()); //Page Size

    const response = await scyllaDataLayer.executeDataQuery(query, params);

    return response;
  }
}

export default PingService;
