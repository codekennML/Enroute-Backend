import axios, { AxiosInstance } from "axios";
import axiosClient from "../../config/axios";
import { DirectionsData, latLngCoordinates } from "../../../types/types";
import { Coordinates } from "../../model/interfaces";

import {
  Client,
  GeocodeResponse,
  TravelMode,
  TransitMode,
  UnitSystem,
  RouteLeg,
  DirectionsResponse,
} from "@googlemaps/google-maps-services-js";

const GOOGLEMAPSKEY = process.env.GOOGLE_MAPS_API_KEY as string;

const mapsConfig: AxiosInstance = axiosClient({
  baseURL: "https://maps.googleapis.com/maps/",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

const mapsClient: Client = new Client({ axiosInstance: mapsConfig });

class MapsRepository {
  private dataLayer: Client;

  constructor(client: Client) {
    this.dataLayer = client;
  }

  async geocode(placeId: string): Promise<latLngCoordinates | void> {
    const { data }: GeocodeResponse = await this.dataLayer.geocode({
      params: {
        place_id: placeId,
        key: GOOGLEMAPSKEY,
      },
    });

    if (!data?.results || data.results.length === 0) {
      console.log("No results found");
    }

    const location = data.results[0].geometry.location;

    const latitude = location.lat;

    const longitude = location.lng;

    const directions: latLngCoordinates = [latitude, longitude];

    return directions;
  }

  async getDirectionData(
    start: latLngCoordinates,
    end: string | latLngCoordinates
  ): Promise<Omit<DirectionsData, "availableSeats">> {
    const { data }: DirectionsResponse = await this.dataLayer.directions({
      params: {
        origin: start,
        destination: end,
        mode: TravelMode.transit,
        transit_mode: [TransitMode.bus],
        alternatives: true,
        units: UnitSystem.metric,
        region: "ng",
        key: GOOGLEMAPSKEY,
      },
    });

    if (!data) throw new Error("Something went wrong");

    const { geocoded_waypoints, routes } = data;

    const polylines: string[] = [];
    const fareSet: Set<number> = new Set();

    for (const route of routes) {
      polylines.push(route.overview_polyline.points);
      fareSet.add(route.fare.value);
    }

    const routeData: Omit<RouteLeg, "steps" | "duration_in_traffic"> =
      routes[0].legs[0];

    const riderCurrentLocationData: Coordinates = {
      placeId: geocoded_waypoints[0].place_id,
      coordinates: [routeData.start_location.lat, routeData.start_location.lng],
      name: routeData.start_address,
    };

    const riderDestinationData: Coordinates = {
      placeId: geocoded_waypoints[1].place_id,
      coordinates: [routeData.end_location.lat, routeData.end_location.lng],
      name: routeData.end_address,
    };

    return {
      fare: fareSet,
      riderDestinationData,
      riderCurrentLocationData,
      polylines,
      duration: routeData.duration.value,
      distance: routeData.distance.value,
      arrivalTime: routeData.arrival_time.value,
      departureTime: routeData.departure_time.value,
    };
  }

  async getOSSDirectionData(start: latLngCoordinates, end: latLngCoordinates) {
    const url = `${process.env.OSS_SERVER_URL}`;

    const data: DirectionsResponse & { code: string } = await axios.get(
      `${url}/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}&geometry=full&continue_straight=false`
    );

    if (data.code === "NoRoute") {
      //Might need to increment number of requests tp google to know how many requests we are making per user

      //We also need to track how many calls are abandoned after in order to know how much revenue we need to generate

      //call the google maps api

      const response = await this.getDirectionData(start, end);
      return {
        distance: response.distance,
        duration: response.duration,
        polyline: response.polylines,
      };
    }

    const response = {
      distance: data.data.routes[0].legs[0].distance,
      duration: data.data.routes[0].legs[0].duration,
      polyline: data.data.routes[0].overview_polyline,
    };

    return response;
  }
}

export const mapsDataLayer = new MapsRepository(mapsClient);

export default MapsRepository;
