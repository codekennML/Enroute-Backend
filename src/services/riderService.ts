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
import { tripsDataLayer } from "../repository/mongo/trips";
import { ITrip } from "../model/interfaces";
import { WebSocket } from "uWebSockets.js";
// import { keyDBLayer, pubSubCacheLayer } from "../repository/data/KeyDB";
import polylineUtilities from "../utils/helpers/locationDescriptor";
import { ridesDataLayer } from "../repository/mongo/ride";
import { routesDataLayer } from "../repository/mongo/route";
import axios from "axios";
// import { Prettify } from '../../types/types';

class DriverService {
  async verification() {
    //This should take 3 days to verify
    //NIN, BVN, address,  place of work  , staff id or work id  , family members or emergency contact, date of birth , vehicle type , vehicle age ,  license   registration,  model ,  make , year , guarantors with valid id , nin and address, place of work contact, nearest landmark,
  }

  async;
}

const RiderService = new DriverService();

export default DriverService;
