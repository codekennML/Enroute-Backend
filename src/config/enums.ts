export enum DOMAINURL {
  baseUrl_user = "api/v1/",
  BASEURL_USER = "/api/v1/users",
}

export enum PAYSTACKCHANNELS {
  USSD = "ussd",
  CARD = "card",
  BANK = "bank",
}

export enum ROLES {
  DRIVER = "driver",
  RIDER = "rider",
  ADMIN = "admin_xxgofar",
}

export enum USER {
  driver = 4536,
  rider = 2435,
}

export enum ADMINROLES {
  SUPERADMIN = 96370,
  ADMIN = 86774,
  ACCOUNT = 76230,
  MARKETING = 7049,
  SALES = 6430,
  DEV = 4325,
  CX = 34564,
}

export enum SUBROLES {
  MANAGER = 9231,
  STAFF = 1230,
  INTERN = 1200,
}

export enum NOTIFICATION {
  SCHEDULE_ACCEPTED = "ride_schedule_accepted",
  SCHEDULE_REJECTED = "ride_schedule_rejected",
  DRIVER_ARRIVED = "driver_arrived",
  RIDE_REQUEST = "ride_schedule_request",
  DOCUMENT_REJECTED = "UPDATED_DOCUMENT_REJECTED",
  DOCUMENT_ACCEPTED = "UPDATED_DOCUMENT_ACCEPTED",
  IDENTITY_VERIFIED = "IDENTIY_DATA_VERIFIED",
  PROMO_RECEIVED = "DISCOUNT_RECEIVED",
  SETTLEMENT_DEBIT = "SETTLEMENT_DEBIT_FAILED",
}
