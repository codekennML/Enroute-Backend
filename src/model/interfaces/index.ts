import {  Types } from "mongoose";
import {
  Paystack,
  EmergencyContact,
  latLngCoordinates,
} from "../../../types/types";
import {

  NOTIFICATION,
} from "../../config/enums";

export interface Coordinates {
  coordinates: latLngCoordinates;
  name?: string;
  placeId?: string;
}

export interface IDocuments {
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
  country : Types.ObjectId
}

export interface ITripSchedule {
  driverId: Types.ObjectId;
  origin: Place;
  destination: Place;
  departureTime: Date;
  seatAllocationsForTrip: number;
  route: string,
  routeDistance : number,
  status: "created" | "cancelled" | "started"
}

export interface INotification {
  type: NOTIFICATION;
  recipient: Types.ObjectId;
  initiator?: Types.ObjectId; //This could be system genereated
  body: string;
  read?: boolean;
}

export interface ISettlements extends Locale {
  amount: number;
  processor: "paystack" | "flutterwave" | "stripe";
  driverId: Types.ObjectId;
  driverEmail?: string
  driverPushId? : string,
  processed: boolean;
  status: "success" | "created" | "failed";
  currency? : string
  data?: Record<string, unknown>;
  rides?: Types.ObjectId[];
  isPaymentInit: boolean
  refunded : boolean
  workerCreated : boolean
  settlements? : { type : "subscription" | "commisison", amount : number }[] //WE need this for when both a us er subscription and commission charges fail at the same time, this beomes the single entry for the combined charge when reevaluating the users payment method 

  type : "subscription" | "commission" | "both"


  //Payment data from processor
}

export interface IKnowledgeBaseCategory extends Locale {
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
  requiredDriverDocs: { name: string, options: string[] }[];
  requiredRiderDocs: { name: string, options: string[] }[]; //These are required verification docs for the specific town, country or state
}

export interface IState {
  name: string;
  country: Types.ObjectId;
  boundary: number[];
  requiredDriverDocs: { name: string, options: string[] }[];
  requiredRiderDocs: { name: string, options: string[] }[]; //These are required verification docs for the specific town, country or state

}

export interface ICountry {
  name: string;
  code: string;
  boundary: number[];
  monthlySubscription : number,
  paymentProcessorbillingPercentage : number, 
  paymentProcessorbillingExtraAmount: number
  currency : string,
  riderCommission : number, 
  driverPercentage : number
  requiredDriverDocs: { name: string, options: string[] }[];
  requiredRiderDocs: { name: string, options: string[] }[]; //These are required verification docs for the specific town, country or state
}

export interface Locale {
  town?: string
  state?: string
  country?: string
}


export interface CancellationData {

  status: boolean;
  initiator: Types.ObjectId;
  initiatedBy: "driver" | "rider" | "admin";
  time: Date;

  //the rest can be undefined if an admin cancels a ride
  cancellationReason?: string;
  driverDistanceFromPickup?: number; //in meters 
  driverEstimatedETA?: number; // estimated ETA before the ride was cancelled in mins

}

export interface IRide {
  driverId: Types.ObjectId;
  tripId: Types.ObjectId;
  riderId: Types.ObjectId;
  packageRequestId?: Types.ObjectId;

  pickupTime: Date;
  dropOffTime?: Date;
  type: "solo" | "share" | "package";
  packageCategory?:  "STS" | "HTH";
  cancellationData?: CancellationData
  seatsOccupied?: number;
  pickupStation?: IBusStation | Place
  origin: Place | IBusStation
  distance?: number
  destination: IBusStation | Place
  dropOffLocation?: Place; //The person may stop at a place other than the bus stop
  route?: Types.ObjectId; //The GEOJSON and time stamp for each
  rideTotalDistance: number;
  acceptedFare: number;
  paidFare?: number
  driverCommission?: number;
  riderCommission?: number;
  totalCommission?: number;
  commissionPaid?: boolean;
  settlement?: {
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

    comments: string;

  };
  friendData?: {
    firstname: string;
    lastname: string;
    countryCode: string;
    mobile: string;
  }[]
}


export interface IRideRequest extends Locale {
  tripScheduleId?: Types.ObjectId,
  driverId: Types.ObjectId;
  driverEmail? : string
  riderId: Types.ObjectId;
  destination: IBusStation;
  pickupPoint: IBusStation
  hasLoad: boolean;
  numberOfSeats?: number;
  type: "share" | "solo"
  cancellationData?: CancellationData
  totalRideDistance: number
  initialStatus: "scheduled" | "live"
  riderBudget : number
  driverBudget? : number, 
  driverDecision? : "accepted" | "rejected" | "riderBudget"
  riderDecision?: "accepted" | "rejected"; //the driver renegotiated the price and the rider has to make a decison
  status: "created" | "cancelled" | "closed";
  friendData? : { firstname: string; lastname: string; countryCode: string; mobile: string; }[] 


}

export interface IVehicle {
  vehicleModel: string;
  vehicleMake: string;
  inspection:  { 
   provider : string, 
   issueDate : Date
   expiryDate : Date
   image : { 
    front : string, 
    back?: string
   } 
  },
    insurance: {
      provider: Date,
      issueDate: Date
      expiryDate: Date
      image: {
        front: string,
        back?: string
      } 
  },
  images : Record<string, string>,
  licensePlate: string
  year: number;
  hasAC: boolean;
  driverId: Types.ObjectId;
  isVerified: boolean;
  isArchived: boolean;
  status: "pending" | "assessed";
  approvedBy: Types.ObjectId;
 country : Types.ObjectId,
 state : Types.ObjectId
}

export interface IRating{ 
  userId : Types.ObjectId, 
  raterId : Types.ObjectId 
  rideId : Types.ObjectId
  rating : number
}

export interface IPackageSchedule {
  createdBy: Types.ObjectId;
  type: "HTH" | "STS"; //Home to home or stop to stop
  budget: number;
  acceptedBudget?: number;
  packageDetails: {

    recipient: {
      firstname: string,
      lastname: string,
      countryCode: string,
      mobile: string
    },
    comments: string
  };
  dueAt: Date;
  expiresAt: Date;
  status: "filled" | "created" | "expired"
  totalDistance: number
  destinationAddress: Place;
  pickupAddress: Place;
  
}

export interface IPackageScheduleRequest {
  packageScheduleId: Types.ObjectId;
  budget: number;
  body: string;
  createdBy: Types.ObjectId;
  status: "accepted" | "rejected" | "cancelled" | "created"
}


export interface IUser extends Locale {
  firstName?: string;
  email?: string;
  avatar?: string;
  archived? : boolean,
  socialName?: string;
  lastName?: string;
  birthDate?: Date;
  mobile?: number;
  gender?: "male" | "female";
  deviceToken: string;
  roles: number ;
  subRole?: number;
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
  // password?: string;
  lastLoginAt: Date;
  emailVerifiedAt: Date;
  mobileVerifiedAt: Date;
  // emailVerificationData?: { token: string; expiry: Date };
  // mobileVerificationData?: { token: string; expiry: Date };
  emailVerified?: boolean;
  mobileVerified?: boolean;
  resetTokenHash?: string;
  refreshToken?: string;
  countryCode: number;
  resetTokenData?: { [key: string]: Date | boolean };
  paymentMethod?: {
    authorization: Paystack.Authorization;
    customer: Paystack.Customer;
    isValid: boolean
    defaults? : Types.ObjectId[]

  };
  invitedBy? : Types.ObjectId
  limitedBy? : Types.ObjectId,
  limitReason? : string,
  about?: string;
  street?: string;
 accessTokenExpiresAt? : Date
  mobileAuthId : string
  dispatchType?: string[];
  rating: number;
  emergencyContacts?: EmergencyContact[];
  stateOfOrigin?: Types.ObjectId;
  serviceType: string[];
  createdAt?: Date;
  updatedAt?: Date;
  devicesTypes: string
  devices: string[]
}

export interface IChat {
  latestMessage?: Types.ObjectId;
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
  town : string, 
  country : string, 
  state : string
}

export interface IBusStation {
  name: string;
  placeId: string;
  country : Types.ObjectId
  state: Types.ObjectId
  town: Types.ObjectId
  suggestedBy? : Types.ObjectId,
  status : "active" | "rejected" | "suggested"
  approvedBy? : Types.ObjectId,
  location: {
    type: "Point";
    coordinates: latLngCoordinates;
  };

}

// export interface ITrans {
//   user: Types.ObjectId;
//   type: "credit" | "debit";
//   amount: number;
//   status: "failed" | "success" | "pending" | "processing";
//   category: "deposit" | "withdrawal" | "tip";
//   awaitingApproval: boolean;
//   isApproved: boolean;
//   data: Record<string, string | number | object>;
// }

// export interface ITransaction {
//   receiver: Types.ObjectId;
//   creator: Types.ObjectId;
//   type: "deposit" | "booking" | "payout" | "commission" | "tip" | "tripRefund";
//   amount: number;
//   approved?: boolean;
//   approvedBy?: Types.ObjectId;
//   systemApproved?: boolean;
//   status: "success" | "failed" | "processing";
//   fraudulent?: boolean;
//   paymentRef?: string;
//   userTransferRef?: string;
//   class: "credit" | "debit";
// }

// export interface IPay {
//   transactionId: Types.ObjectId;
//   userPaymentRef?: string;
//   creator: Types.ObjectId;
//   receiver: Types.ObjectId;
//   email?: string;
//   processed?: false;
//   type: "refund" | "withdrawal" | "deposit";
//   amount: number;
//   channel?: PAYSTACKCHANNELS;
//   status: "success" | "failed" | "created" | "queued" | "requires_action";
//   currency?: string;
//   amountSettled?: number;
//   tax?: number;
//   data?: {
//     reference: string;
//     authorization: string;
//   };
//   approved?: boolean;
//   approvedBy?: Types.ObjectId;
//   autoRetries: number;
//   manualRetries: number;
// }

export type IOtp = {
  user?: Types.ObjectId;
  mobile? : number ,
  countryCode ? : number
  email?: string;
  hash?: string;
  expiry?: Date;
  active?: boolean;
  channel: string;
  next?: string;
};


export interface IRoute {
  tripId?: Types.ObjectId;
  rideId?: Types.ObjectId;
  vehicleId?: Types.ObjectId;
  timedGeojson: {
    coordinates: latLngCoordinates[];
    timestamp : Date
  }
  
  lineString: string;
}

export type Place = {
  name: string;
  location: {
    type: "Point";
    coordinates: latLngCoordinates;
  };
  state?: string;
  town?: string;
  country?: string;
  placeId: string;
};

export interface ITrip {
  // createdAt: { $gte: Date; $lte: Date; };
  driverId: Types.ObjectId;
  origin: Place;
  destination: Place;
  distance: number
  departureTime: Date;
  endTime?: Date
  totalfare?: number,
  seatAllocationsForTrip: number;
  route: string
  initialStatus: "none" | "scheduled"
  status: "cancelled" | "ongoing" | "completed" | "crashed" | "paused"
}

export interface IRideSchedule {
  rideRequest : Types.ObjectId,
  tripId : Types.ObjectId,
  driverId : Types.ObjectId
  riderId : Types.ObjectId
  driverPushId : string, 
  riderPushId : string,
  driverEmail : string,  
  riderEmail : string
  status : "created" | "closed" | "cancelled", 
  driverBudget : number 
  riderAccepted : boolean
}