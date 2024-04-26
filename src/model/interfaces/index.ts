import { Types } from "mongoose";
import {
  Paystack,
  EmergencyContact,
  latLngCoordinates,
} from "../../../types/types";
import {
  ADMINROLES,
  NOTIFICATION,
  PAYSTACKCHANNELS,
  SUBROLES,
  USER,
} from "../../config/enums";

export interface Coordinates {
  coordinates: latLngCoordinates;
  name?: string;
  placeId?: string;
}

export type IDocuments = {
  userId: Types.ObjectId;
  vehicleId?: Types.ObjectId;
  name: string; //Xdaafsghs
  imageUrl: string[]; //Picture of uploaded imaage
  isVerified?: boolean; //true or flase
  verificationResponse?: Record<string, unknown>; //Result from verification api
  issued?: Date;
  expiry?: Date;
  isRejected?: boolean;
  archived?: boolean;
  fieldData?: Record<string, string>;
  rejectionFeedback?: string;
  status?: "pending" | "assessed" | "none";
  approvedBy?: Types.ObjectId;
};

export interface INotification {
  type: NOTIFICATION;
  recipient: Types.ObjectId;
  initiator?: Types.ObjectId; //This could be system genereated
  body: string;
  read?: boolean;
}

export interface ISettlements {
  amount: number;
  processor: "paystack" | "flutterwave" | "stripe";
  driverId: Types.ObjectId;
  processed: boolean;
  status: "success" | "created" | "failed";
  data?: Record<string, unknown>;
  rides: Types.ObjectId[];

  //Payment data from processor
}

export interface IKnowledgeBaseCategory {
  name: string;
  isParent: boolean;
  parentId: Types.ObjectId;
}

export interface IKnowledgeBase {
  title: string;
  body: string;
  parentCategory?: Types.ObjectId;
  subCategory?: Types.ObjectId;
  country: Types.ObjectId;
}

export interface ITown {
  name: string;
  state: Types.ObjectId;
  country: Types.ObjectId;
  requiredDocs: string[]; //These are required verification docs for the specific town, country or state
}

export interface IState {
  name: string;
  country: Types.ObjectId;
  boundary: number[];
  requiredDocs: string[];
}

export interface ICountry {
  name: string;
  code: string;
  boundary: number[];
  requiredDocs: string[];
}

export interface Locale {
  town: Types.ObjectId;
  state: Types.ObjectId;
  country: Types.ObjectId;
}

export interface IRide {
  driverId: Types.ObjectId;
  tripId: Types.ObjectId;
  riderId: Types.ObjectId;
  packageRequestId: Types.ObjectId;
  pickupTown: Types.ObjectId;
  pickupState: Types.ObjectId;
  pickupCountry: Types.ObjectId;
  pickedUp: boolean;
  pickupTime: Date;
  alighted?: boolean;
  dropOffTime?: Date;
  dropOffTown: Types.ObjectId;
  dropOffState: Types.ObjectId;
  dropOffCountry: Types.ObjectId;
  type: "package" | "self" | "thirdParty";
  category: "charter" | "pool";
  cancellationData?: {
    status: boolean;
    initiator: Types.ObjectId;
    initiatedBy: "driver" | "rider";
    time: Date;
    cancellationReason: string;
    driverDistanceFromPickup: number; //in meters
    driverEstimatedETA: number; // estimated ETA before the ride was cancelled in mins
  };
  seatsOccupied?: number;
  pickupStation: IBusStation;
  origin: Place;
  destination: IBusStation;
  dropOffLocation?: Place; //The person may stop at a place other than the bus stop
  route?: Types.ObjectId; //The GEOJSON and time stamp for each
  rideTotalDistance: number;
  acceptedFare: number;
  driverCommission: number;
  riderCommission: number;
  totalCommission: number;
  commissionPaid: boolean;
  settlement: {
    //The settlement id that settled the commission and how much was paid
    identifier: Types.ObjectId;
    amount: number;
  };
  initialStatus: "none" | "scheduled";
  status:
    | "scheduled"
    | "cancelled"
    | "ongoing"
    | "completed"
    | "crashed"
    | "abandoned";
  packageDetails?: {
    recipient: {
      firstname: string;
      lastname: string;
      countryCode: string;
      mobile: string;
    };
    description: string;
    comments: string;
  };
  thirdPartyData: {
    firstname: string;
    lastname: string;
    countryCode: string;
    mobile: string;
  };
}

export interface IVehicle {
  vehicleModel: string;
  vehicleMake: string;
  insurance: Types.ObjectId;
  inspection: Types.ObjectId;
  year: number;
  hasAC: boolean;
  driverId: Types.ObjectId;
  isVerified: boolean;
  isArchived: boolean;
  status: "pending" | "assessed";
  approvedBy: Types.ObjectId;
  town: string;
  state: string;
  country: string;
}

export interface ITickets {
  userId: Types.ObjectId;
  email: string;
  category: Types.ObjectId;
  title: string;
  body: string;
  documentsUrl?: {
    url: string;
    type: "image" | "video";
    format: "png" | "mp4";
    name: string;
  }[];
}

export interface IPackageSchedule {
  createdBy: Types.ObjectId;
  type: "HTH" | "STS"; //Home to home or stop to stop
  budget: number;
  acceptedBudget?: number;
  summary: string;
  dueAt: Date;
  expiresAt: Date;
  status: string;
  destinationAddress: Place;
  pickupAddress: Place;
  destinationTown: Types.ObjectId;
  destinationState: Types.ObjectId;
  pickupTown: Types.ObjectId;
  pickupState: Types.ObjectId;
  pickupCountry: Types.ObjectId;
}

export interface IPackageScheduleRequest {
  packageScheduleId: Types.ObjectId;
  budget: number;
  body: string;
  createdBy: Types.ObjectId;
  status: string;
}
export interface IRideRequest extends Locale {
  tripId: Types.ObjectId;
  driverId: Types.ObjectId;
  driverEmail: string;
  riderEmail: string;
  riderId: Types.ObjectId;
  driverDecision: "accepted" | "rejected" | "negotiated";
  riderBudget: number;
  driverBudget: number;
  destination: IBusStation;
  pickupPoint: Place;
  hasLoad: boolean;
  numberOfSeats?: number;
  type: "package" | "selfride" | "thirdParty";
  packageInfo?: {
    packageContents: string;
    packageWeight?: number;
    recipient?: {
      name: string;
      countryCode: string;
      mobile: string;
    };
  };
  riderDecision: "accepted" | "rejected"; //the driver renegotiated the price and the rider has to make a decison
  status: "created" | "cancelled" | "closed";
}

export interface IUser extends Locale {
  firstName: string;
  email?: string;
  avatar?: string;
  socialName?: string;
  lastName: string;
  birthDate?: Date;
  mobile: string;
  gender?: "male" | "female";
  deviceToken?: string;
  roles: ADMINROLES | USER;
  subRole?: SUBROLES;
  hasUsedSocialAuth: boolean;
  googleId?: string;
  googleEmail?: string;
  fbId?: string;
  fbEmail?: string;
  appleId?: string;
  appleEmail?: string;
  status: "new" | "verified";

  verifyHash?: { token: string; expiresAt: Date };
  // hasSuppliedInfo?: boolean;
  verified: boolean;
  active?: boolean;
  suspended?: boolean;
  banned?: boolean;
  password?: string;
  lastLoginAt: Date;
  emailVerifiedAt: Date;
  mobileVerifiedAt: Date;
  emailVerificationData?: { token: string; expiry: Date };
  mobileVerificationData?: { token: string; expiry: Date };
  emailVerified?: boolean;
  mobileVerified?: boolean;
  resetTokenHash?: string;
  refreshToken?: string;
  countryCode?: number;
  resetTokenData?: { [key: string]: Date | boolean };
  deviceIds: string[];
  // balance: number;
  userTransferRef?: string[];
  paymentMethod?: {
    authorization: Paystack.Authorization;
    customer: Paystack.Customer;
  };
  about?: string;
  street?: string;
  isOnline?: boolean;
  // vehicle: Types.ObjectId;
  // identification?: Types.ObjectId; //Passport or NIN
  // selfie: Types.ObjectId; //Face detection data
  // license: Types.ObjectId; //Driver license
  // lasraa: Types.ObjectId;
  dispatchType?: string[];
  rating: number;
  emergencyContacts?: EmergencyContact[];
  stateOfOrigin?: string;
  serviceType: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IChat {
  latestMessage: Types.ObjectId;
  users: Types.ObjectId[];
  status: "closed" | "open";
  tripId: Types.ObjectId;
  rideId: Types.ObjectId;
}

export interface IMessage {
  chatId: Types.ObjectId;
  body: string;
  deliveredAt?: Date;
  sentBy: Types.ObjectId;
}

export interface ISOS extends Locale {
  tripId: Types.ObjectId;
  rideId: Types.ObjectId;
  initiator: Types.ObjectId;
  lastLocation: {
    type: "Point";
    coordinates: number[];
  };
}

export interface IBusStation extends Locale {
  name: string;
  placeId: string;
  location: {
    type: "Point";
    coordinates: latLngCoordinates;
  };
}

export interface IAddress extends Locale {
  name: string;
  documents: Types.ObjectId;
}

export interface ITrans {
  user: Types.ObjectId;
  type: "credit" | "debit";
  amount: number;
  status: "failed" | "success" | "pending" | "processing";
  category: "deposit" | "withdrawal" | "tip";
  awaitingApproval: boolean;
  isApproved: boolean;
  data: Record<string, string | number | object>;
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

export type IOtp = {
  user?: Types.ObjectId;
  email?: string;
  hash?: string;
  expiry?: Date;
  active?: boolean;
  channel: string;
  next?: string;
};

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

export interface IUserPlaces {
  user: Types.ObjectId;
  busStation: Types.ObjectId;
}

export interface IRoute {
  tripId?: Types.ObjectId;
  rideId?: Types.ObjectId;
  vehicleId?: Types.ObjectId;
  geojson: latLngCoordinates[];
  timestamps: Date[];
  lineString: string;
}

type Place = {
  name: string;
  location: {
    type: "Point";
    coordinates: Coordinates;
  };
  state?: string;
  town?: string;
  country?: string;
  placeId: string;
};

export interface ITrip {
  driverId: Types.ObjectId;
  origin: Place;
  originTown: Types.ObjectId;
  originState: Types.ObjectId;
  originCountry: Types.ObjectId;
  destinationTown: Types.ObjectId;
  destinationState: Types.ObjectId;
  destination: Place;
  vehicleId: Types.ObjectId;
  departureTime: Date;
  seatAllocationsForTrip: number;
  route: Types.ObjectId;
  status: "scheduled" | "cancelled" | "ongoing" | "completed" | "crashed";
}
