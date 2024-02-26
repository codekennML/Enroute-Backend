import { ADMINROLES } from "../src/config/enums";
import { Coordinates } from "../src/model/interfaces";
import { LocationCacheData } from "./types";

declare module "@turf/turf";
declare module "@mapbox/polyline";
declare module "jsonwebtoken";

export interface BasicUserData {
  name: string;
  avatar: string;
  id: string;
}

export interface UserData extends BasicUserData {
  url: string;
  sessionId: string;
}

interface Request {
  clientIp: string;
  clientDevice: string;
}

export interface UpdateRequestData {
  docToUpdate: Types.ObjectId;
  updateData: Record<string, string | boolean | object>;
  options: {
    session?: ClientSession;
    new?: boolean;
    select?: string;
    upsert?: boolean;
    projection?: { [key: string]: number };
  };
}
export type UpdateManyData = Omit<UpdateRequestData, "docToUpdate"> & {
  filter: { [key: string]: object };
};

export type MobileSignupData = {
  readonly mobile: string;
  userId?: Types.ObjectId;
  mobile: boolean;
  // mobileId: string;
  roles: ADMINROLES | USER;
} & Request;

export type WebSignupData = {
  email: string;
  password: string;
  roles: Pick<MobileSignupData, "roles">;
} & Request;

export type SignupData = MobileSignupData | WebSignupData;

export type RegistrationData = {
  firstName: string;
  lastName: string;
  birthDate: Date;
  address: string;
  gender: "male" | "female" | "others";
  user: string;
};

export type TransferRecipient = Pick<
  RegistrationData,
  "user" | "firstName" | "lastName"
> & {
  acct: string;
  bankcode: string;
};

export type LoginData = SignupData;

export type AuthData = {
  otpId: string;
  otp: string;
  vfm: boolean;
  type: string;
};

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//Mongo Transaction return values

interface TransactionError {
  success: boolean;
  data: { errrorMsg: string };
}

export type TransactionSuccess<T> = Pick<TransactionError, "success"> & {
  data: T;
};

export type TransactionResponse<T> = TransactionSuccess<T> | TransactionError;
//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
export type ActivateAccountData = {
  token: string;
  user: string;
  clientIp?: string;
};

export type ActivationMailData = Pick<ActivateAccountData, "userId"> & {
  identifier: string;
  email;
};

export type ResetPasswordData = {
  userId: string;
  token: string;
  password: string;
  sus?: boolean;
};

export type Prettify<T> = {
  [P in keyof T]: T[P];
} & object;

export interface WSIncomingData {
  userType: "rider" | "driver" | "control";
  topic: string;
  userId?: string;
  sessionId?: string;
  data: Record<string, object>;
}

export type latLngCoordinates = [number, number];

export interface PlaceData {
  placeId: string;
  coordinates: latLngCoordinates;
  name: string;
}

export type DirectionsData = {
  fare?: Set<number>;
  riderDestinationData: Coordinates;
  riderCurrentLocationData: Coordinates;
  polylines: string[];
  distance: number;
  duration: number;
  arrivalTime: Date;
  departureTime: Date;
  availableSeats: number;
};

type CommonLocationData = {
  coordinates: latLngCoordinates;
};

interface DriverData extends CommonLocationData {
  driver: BasicUserData;
  trip: string;
  availableSeats: number;
}

interface RiderData extends CommonLocationData {
  rider: BasicUserData;
  ride: string;
}

export type LocationUpdateData = DriverData | RiderData;

export type LocationCacheData = Omit<
  DriverData,
  "availableSeats",
  "coordinates"
> & {
  key: string;
  conn: string;
  availableSeats: number;
  trip;
};

export interface RideRequestData {
  rider: BasicUserData;
  fare: number[];
  conn: string;
  destination: Omit<PlaceData, "placeId">;
}

export interface RideRequestResponseData {
  topic: "interestToRide";
  accepted: boolean;
  driver: BasicUserData;
  riderConn: string;
  conn: string;
}

export interface RideCancellationData {
  topic: "rideCancellation";
  driverId: string;
  rider: {
    id: string;
    conn: string;
    rideId: string;
  };
}

export type StartTripData = Pick<LocationCacheData, "trip"> &
  Pick<RideCancellationData, "rider" | "driverId"> & { topic: "tripStarted" };

export interface EndedRideType {
  tripId: string;
  rideId: string;
  currentLocation: latLngCoordinates;
}

export type EndTripType = Pick<EndedRideType, "tripId">;

export type TransferData = {
  transferRef: string;
  amount: number;
  reason: string;
  paymentId: string;
};

export namespace Paystack {
  export type Customer = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    customer_code: string;
    phone: string;
    metadata: unknown; // Update this based on the actual structure
  };

  export type Authorization = {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    channel: string;
    card_type: string;
    bank: string;
    country_code: string;
    brand: string;
    reusable: boolean;
  };

  export interface VerifyResponse {
    status: boolean;
    message: string;
    data: {
      id: number;
      amount: number;
      currency: string;
      transaction_date: string;
      status: string;
      reference: string;
      domain: string;
      metadata: {
        custom_fields: unknown[]; // Update this based on the actual structure
      };
      gateway_response: string;
      message: string;
      channel: string;
      ip_address: string;
      log: unknown[]; // Update this based on the actual structure
      fees: number;
      authorization: Authorization;
      customer: Customer;
    };
  }

  export interface CreateTransferRecipientResponse {
    status: boolean;
    message: string;
    data: {
      active: boolean;
      createdAt: string;
      currency: string;
      domain: string;
      id: number;
      integration: number;
      name: string;
      recipient_code: string;
      type: string;
      updatedAt: string;
      is_deleted: boolean;
      details: {
        authorization_code: null | string;
        account_number: string;
        account_name: string;
        bank_code: string;
        bank_name: string;
      };
    };
  }

  export interface TransferStatus {
    status: boolean;
    message: string;
    data: {
      integration: number;
      domain: string;
      amount: number;
      currency: string;
      source: string;
      reason: string;
      recipient: number;
      status: string;
      transfer_code: string;
      id: number;
      createdAt: string;
      updatedAt: string;
    };
  }

  interface BalanceData {
    currency: string;
    balance: number;
  }

  export interface BalanceResponse {
    status: boolean;
    message: string;
    data: BalanceData[];
  }

  export interface AccountInfoResponse {
    status: boolean;
    message: string;
    data: {
      account_number: string;
      account_name: string;
      bank_id: number;
    };
  }

  interface Bank {
    name: string;
    slug: string;
    code: string;
    longcode: string | null;
    gateway: string; // Change this type based on the actual data type
    pay_with_bank: boolean;
    active: boolean;
    is_deleted: boolean;
    country: string;
    currency: string;
    type: string;
    id: number;
    createdAt: string; // Change this type to Date if needed
    updatedAt: string; // Change this type to Date if needed
  }

  export interface BanksResponse {
    status: boolean;
    message: string;
    data: Bank[];
  }

  export interface TransferValidation {
    reference: string;
    amount: number;
    recipient: string;
    reason: string;
    source?: string;
  }

  export type WebhookResponse = {
    event: string;
    data: {
      status: string;
      reference: string;
      amount: number;
      [x: string]: string | object;
    };
  };
}

export namespace Ping {
  export interface DriverPing {
    tripId: string;
    cache: boolean;
    availableSeats: number;
    carId: string;
    driverId: string;
    coordinates: latLngCoordinates;
    createdAt: Date;
    date: Date;
  }

  export type DriverCachePing = DriverPing & {
    cellId: string;
  };

  export type RiderPing = Omit<DriverPing, "driverId" | "tripId"> & {
    riderId: string;
    rideId: string;
  };
}
