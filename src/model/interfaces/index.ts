import { Types } from "mongoose";
import { Paystack, latLngCoordinates } from "../../../types/types";
import {
  ADMINROLES,
  PAYSTACKCHANNELS,
  SUBROLES,
  USER,
} from "../../config/enums";

export interface Coordinates {
  coordinates: latLngCoordinates;
  name?: string;
  placeId?: string;
}

export interface IRide {
  riderId: Types.ObjectId;

  pickedUp: boolean;
  pickupTime: Date;
  alighted: boolean;
  droppedOffLocation?: string;
  dropOffTime?: Date;
  cancelled: {
    status: boolean;
    initiatedBy: string;
    time: Date;
  };

  rideData: {
    destination: Pick<Coordinates, "placeId" | "coordinates">;
    start_location: Pick<Coordinates, "placeId" | "coordinates">;
    polyline: string;

    lineString: string;

    rideTotalDistance: number;
  };

  ride_fare_estimate: number[];

  accepted_fare: number;

  ongoing: boolean;

  completed: boolean;

  driverId: Types.ObjectId;

  tripId: Types.ObjectId;
}

export interface IUser {
  firstName: string;
  email: string;
  avatar?: string;
  lastName: string;
  birthDate: Date;
  mobile: string;
  gender: "male" | "female" | "others";
  roles: ADMINROLES | USER;
  subRole?: SUBROLES;
  googleId?: string;
  fbId?: string;
  verifyHash?: { token: string; expiresAt: Date };
  hasSuppliedInfo: boolean;
  verified?: boolean;
  active: boolean;
  suspended?: boolean;
  banned?: boolean;
  password?: string;
  lastLoginAt: Date;
  mobileAuthId?: string;
  emailVerificationData?: { token: string; expiry: Date };
  mobileVerificationData?: { token: string; expiry: Date };
  emailVerified?: boolean;
  mobileVerified?: boolean;
  resetTokenHash?: string;
  refreshToken?: string;
  resetTokenData?: { [key: string]: Date | boolean };
  // deviceId?: string;
  balance: number;
  userTransferRef: string[];
  paymentMethod?: {
    authorization: Paystack.Authorization;
    customer: Paystack.Customer;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction {
  receiver: Types.ObjectId;
  creator: Types.ObjectId;
  type: "deposit" | "booking" | "payout" | "commission" | "tip" | "tripRefund";
  amount: number;
  approved?: boolean;
  approvedBy?: Types.ObjectId;
  systemApproved?: boolean;
  status: "success" | "failed" | "processing";
  fraudulent?: boolean;
  paymentRef?: string;
  userTransferRef?: string;
  class: "credit" | "debit";
}

export interface IPay {
  transactionId: Types.ObjectId;
  userPaymentRef?: string;
  creator: Types.ObjectId;
  receiver: Types.ObjectId;
  email?: string;
  processed?: false;
  type: "refund" | "withdrawal" | "deposit";
  amount: number;
  channel?: PAYSTACKCHANNELS;
  status: "success" | "failed" | "created" | "queued" | "requires_action";

  currency?: string;
  amountSettled?: number;
  tax?: number;
  data?: {
    reference: string;
    authorization: string;
  };
  approved?: boolean;
  approvedBy?: Types.ObjectId;
  autoRetries: number;
  manualRetries: number;
}

export interface IOtp {
  user: Types.ObjectId;
  hash: string;
  expiry: Date;
  type: string;
  active: boolean;
}

export interface IUserAccess {
  user: Types.ObjectId;
  ipAddresses: Record<
    string,
    {
      lastLoginAt: Date;
      susAttempts: number;
      blacklisted: boolean;
    }
  >;
  devices: Record<
    string,
    {
      lastLoginAt: Date;
      susAttempts: number;
      blacklisted: boolean;
    }
  >;
}

export interface IPlaces {
  user: Types.ObjectId;
  placeId: string;
  coordinates: [number, number];
  name: string;
  label: string;
}

export interface IRoute {
  user: Types.ObjectId;
  userType: "driver" | "rider";
  tripId?: Types.ObjectId;
  rideId?: Types.ObjectId;
  carId?: Types.ObjectId;
  availableSeats?: number;
  coordinates: [number, number];
  createdAt: Date;
}

export interface ITrip {
  driverId: Types.ObjectId;
  tripLocations: {
    start: Coordinates;
    end: Coordinates;
    polylines: string[];
  };
  ongoing: boolean;
  // rides?: [Types.ObjectId];
}
