import { ClientSession, Types } from "mongoose";
import {
  DirectionsData,
  UserData,
  WSIncomingData,
  latLngCoordinates,
  LocationCacheData,
  LocationUpdateData,
  RideRequestResponseData,
  RideCancellationData,
  StartTripData,
  EndedRideType,
} from "../../types/types";
import { tripsDataLayer } from "../repository/trips";
import { ITrip } from "../model/interfaces";
import { WebSocket } from "uWebSockets.js";
// import { keyDBLayer, pubSubCacheLayer } from "../repository/data/KeyDB";
import polylineUtilities from "../utils/helpers/locationDescriptor";
import { ridesDataLayer } from "../repository/ride";
import { routesDataLayer } from "../repository/route";
import axios from "axios";
// import { Prettify } from '../../types/types';

class Driver {
  async verification() {
    //This should take 3 days to verify
    //NIN, BVN, address,  place of work  , staff id or work id  , family members or emergency contact, date of birth , vehicle type , vehicle age ,  license   registration,  model ,  make , year , guarantors with valid id , nin and address, place of work contact, nearest landmark,
  }

  async;

  async handleCacheUpdateData(
    data: { coordinates: latLngCoordinates; availableSeats: number },
    user: UserData,
    trip: string
  ) {
    const cellID = polylineUtilities.convertCoordinatesToH3CellId(
      data.coordinates
    );

    const cacheData: LocationCacheData = {
      key: cellID,
      driver: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      },
      availableSeats: data.availableSeats,
      conn: process.env.APP_SERVER_ADDRESS as string,
      trip,
    };

    //This sends data to KeyDB and expires the driver hash after the specified timeout seconds
    await keyDBLayer.hset(
      cellID,
      cacheData.driver.id,
      JSON.stringify(cacheData)
    );

    const timeout = 9;

    await keyDBLayer.call(
      "expiremember",
      `${cellID}, ${cacheData.driver.id}, ${timeout}`
    );
  }

  async handleDriverMessages(
    ws: WebSocket<UserData>,
    message: WSIncomingData,
    session?: ClientSession
  ): Promise<void | ITrip[]> {
    switch (message.topic) {
      case "start_new_trip": {
        //Receive the data from the client once the driver clicks begin trip

        const data = message.data as DirectionsData;

        const user = ws.getUserData();

        const request = {
          driverId: new Types.ObjectId(user.id),
          tripLocations: {
            start: data.riderCurrentLocationData,
            end: data.riderDestinationData,
            polylines: data.polylines,
          },
          ongoing: true,
        };

        //Save the trip in the trip DB
        const trip = await tripsDataLayer.createTrip(request, session);

        await this.handleCacheUpdateData(
          {
            coordinates: data.riderCurrentLocationData.coordinates,
            availableSeats: data.availableSeats,
          },
          user,
          trip[0]._id
        );

        break;
      }

      case "location_update": {
        const data = message.data as LocationUpdateData;

        const user = ws.getUserData();

        if (!("driver" in data)) break;

        const { trip, coordinates, availableSeats } = data;

        await this.handleCacheUpdateData(
          { coordinates, availableSeats },
          user,
          trip
        );

        break;
      }

      case "express_interest_to_ride": {
        //This does not accept rides in the literal sense , rather it indicates interest, it is only a rider that can accept who they ride with
        const data = message.data as RideRequestResponseData;

        //If it was rejected, we dont need to do anything else
        if (!data.accepted) break;

        const { riderConn, ...responseInfo } = data;

        await pubSubCacheLayer.publish(
          `channel:${riderConn}`,
          JSON.stringify(responseInfo)
        );

        break;
      }

      case "cancel_ride": {
        const data = message.data as RideCancellationData;

        //update the status to cancelled in the database
        await ridesDataLayer.updateRides({
          docToUpdate: new Types.ObjectId(data.rider.rideId),
          updateData: {
            $set: {
              "cancelled.status": true,
              initiatedBy: data.driverId,
              time: Date.now(),
            },
          },
          options: {
            new: true,
            select: "driverId  ",
          },
        });

        //Send a pubsub for cancellation to rider server
        await pubSubCacheLayer.publish(
          `channel:${data.rider.conn}`,
          JSON.stringify(data)
        );

        break;
      }

      case "start_ride": {
        const data = message.data as StartTripData;

        //update the status to ongoingin the database
        await ridesDataLayer.updateRides({
          docToUpdate: new Types.ObjectId(data.rider.rideId),
          updateData: {
            $set: {
              pickupTime: Date.now(),
              ongoing: true,
              driverId: data.driverId,
              tripId: data.trip,
            },
          },
          options: {
            new: true,
            select: "driverId",
          },
        });

        //update the status to cancelled in the database

        //Send a pubsub for cancellation to rider server
        await pubSubCacheLayer.publish(
          `channel:${data.rider.conn}`,
          JSON.stringify(data)
        );

        //TODO:Send an identifying message

        break;
      }

      case "end_ride": {
        const data = message.data as EndedRideType;

        //retrieve the current position ,  compare with destination coordinates on osrm server route, if less tham 1km , bill accepted fare
        const ride = await ridesDataLayer.findRide({
          query: { _id: new Types.ObjectId(data.rideId) },
          select: "rideData ride_fare_estimate pickupTime",
        });

        if (!ride) throw new Error("Something went wrong ");

        const rideDestination = ride[0].rideData.destination;

        const distanceBetweenCurrentLocationAndDestination =
          await polylineUtilities.calculateDistanceBetweenPoints(
            data.currentLocation,
            rideDestination.coordinates,
            "meters"
          );

        let ridefare = Math.max(...ride[0].ride_fare_estimate);

        if (distanceBetweenCurrentLocationAndDestination <= 1000)
          ws.send(
            JSON.stringify({ topic: "ride_bill", data: { bill: ridefare } })
          );
        else {
          //Get a random  subset of the trip route from time the trip started

          const routeSampleCoordinates = await routesDataLayer.sampleRouteData([
            {
              $match: {
                trip: { $eq: data.tripId },
              },
            },

            {
              $sample: { size: 30 },
            },

            { $sort: { createdAt: 1 } },

            {
              $project: {
                coordinates: 1,
              },
            },
          ]);

          if (!routeSampleCoordinates) throw new Error("Something went wrong");

          let routeString = `${ride[0].rideData.start_location.coordinates[0]},${ride[0].rideData.start_location.coordinates[1]}`;

          routeSampleCoordinates.forEach(
            (data) =>
              (routeString += `;${data.coordinates[0]},${data.coordinates[1]}`)
          );

          routeString += `;${ride[0].rideData.destination.coordinates[0]},${ride[0].rideData.destination.coordinates[1]}`;

          //Send this constructed route to the osrm server and pull the route data

          const url = `${
            process.env.OSRM_SERVER_URL as string
          }/${routeString}?alternatives=false&geometries=geojson&continue_straight=false&steps=false&annotations=false`;

          //${ride[0].rideData.start_location.coordinates[0]};
          const routeData = await axios.get(url);

          if (!routeData) throw new Error("Something went wrong");

          const { routes, code } = routeData;

          if (!routes?.geometry || code !== "Ok")
            throw new Error("Something went wrong");

          const routeLineString =
            polylineUtilities.convertCoordinatesToLineString(routes.geometry);

          const calculateBill = (
            distance: number,
            pickupTime: Date
          ): number => {
            const basefare = 180;

            let fare = 0;

            // Replace with your actual pickup time
            const currentTime = new Date();
            const timeDifferenceInMilliseconds =
              currentTime.getTime() - pickupTime.getTime();
            const timeDifferenceInMinutes = Math.floor(
              timeDifferenceInMilliseconds / (1000 * 60)
            );

            const timeBill = 2 * timeDifferenceInMinutes;

            if (distance >= 60) {
              fare = 20;
            } else if (distance >= 50) {
              fare = 22;
            } else if (distance >= 40) {
              fare = 25;
            } else if (distance >= 35) {
              fare = 28;
            } else if (distance >= 25) {
              fare = 30;
            } else if (distance >= 15) {
              fare = 37;
            } else if (distance >= 10) {
              fare = 42;
            } else if (distance >= 5) {
              fare = 48;
            } else {
              fare = 55;
            }

            return basefare + timeBill + fare;
          };

          ridefare = calculateBill(routeLineString.length, ride[0].pickupTime);

          await ridesDataLayer.updateRides({
            docToUpdate: new Types.ObjectId(data.rideId),
            updateData: {
              $set: {
                completed: true,
                ongoing: false,
                dropoffTime: Date.now(),
              },
            },
            options: {},
          });

          ws.send(
            JSON.stringify({ topic: "ride_bill", data: { bill: ridefare } })
          );
        }

        break;
      }

      case "end_trip": {
        const data = message.data;

        const { tripId } = data;

        //Check  if there are any ongoing rides
        const ongoingTripRides = await ridesDataLayer.findRide({
          query: {
            tripId: { $eq: tripId },
            ongoing: { $eq: true },
          },
          select: "ongoing",
        });

        if (!ongoingTripRides) throw new Error("Something went wrong");

        if (ongoingTripRides.length > 0)
          ws.send(
            JSON.stringify({
              topic: "end_trip_fail",
              data: {
                message:
                  "Ongoing rides have to be completed before trip can be ended",
              },
            })
          );

        //End trips otherwise

        ws.send(JSON.stringify({ topic: "end_trip_success" }));
        //update the status to cancelled in the database
        break;
      }

      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const exhaustiveness = message.topic as never;
        console.log(exhaustiveness);
        break;
      }
    }
  }
}

const DriverService = new Driver();

export default DriverService;
