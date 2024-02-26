import { latLngCoordinates } from "../../types/types";
import { Coordinates } from "../model/interfaces";
import MapsRepository, { mapsDataLayer } from "../repository/data/maps";

class DirectionService {
  private mapsInterface: MapsRepository;

  constructor(maps: MapsRepository) {
    this.mapsInterface = maps;
  }

  async getPlaceGeocodeGoogleMaps(placeId: string) {
    return await this.mapsInterface.geocode(placeId);
  }

  async getGoogleMapsDirections(lat: number, lng: number, placeId: string) {
    const DirectionsData = await this.mapsInterface.getDirectionData(
      [lat, lng],
      placeId
    );

    return DirectionsData;
  }

  async getOSSMapsDirection(start: latLngCoordinates, end: latLngCoordinates) {
    return await this.mapsInterface.getOSSDirectionData(start, end);
  }
}

export const Directions = new DirectionService(mapsDataLayer);

export default DirectionService;
