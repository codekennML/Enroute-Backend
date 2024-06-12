import { Schema, Model, model, SchemaTypes } from "mongoose";
import { IUser } from "./interfaces";


const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      trim: true,
      max: 100,
    },

    email: {
      type: String,
      max: 255,
      required:  () =>  {
        return !this.mobile;
      },
      index: true,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
      max: 100,
    },

    birthDate: {
      type: Date,
      required: [true, "User Date of Birth required"],
    },

    roles: {
      type: Number,
      required: true,
    },

    countryCode: Number,

    subRole: {
      type: Number,
    },

    active: {
      type: Boolean,
      required: true,
      default: true,
    },

    mobile: {
      type: Number,
      unique: true,
      max: 13, // +2348105481234
      required: [true, "User Phone number is required"],
      index: true,
    },

    avatar: {
      type: String,
      default: ".......a...s..s.",
      required: [true, "User avatar is required"],
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    googleId: {
      type: String,
      index: true,
    },

    deviceToken: {
      type: String,
    },

    googleEmail: {
      type: String,
      required: function () {
        return this?.googleId;
      },
    },

    fbId: {
      type: String,
      index: true,
    },

    fbEmail: {
      type: String,
      required: function () {
        return this?.fbId;
      },
    },

    appleId: {
      type: String,
      index: true,
    },

    appleEmail: {
      type: String,
      required: function () {
        return this.appleId;
      },
    },

    socialName: String,

    verifyHash: {
      token: String,
      expires: Date,
    },

    verified: { type: Boolean, default: false },

    suspended: {
      type: Boolean,
      default: false,
    },

    banned: {
      type: Boolean,
      default: false,
      required: true,
    },

    mobileVerificationData: {
      token: String,
      expiry: Date,
    },

    emailVerificationData: {
      token: String,
      expiry: Date,
    },

    emailVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    emailVerifiedAt: Date,
    mobileVerifiedAt: Date,

    resetTokenHash: {
      type: String,
      index: true,
    },

    resetTokenData: {
      expiry: Date,
      used: Boolean,
    },

    paymentMethod: {
      authorization: Object,
      customer: Object,
      isValid : true
    },

    refreshToken: {
      index: true,
      type: String,
    },

    lastLoginAt: Date,

    serviceType: {
      type: [String],
      enum: ["dispatch", "ride"],
      required: true,
    },

    dispatchType: {
      type: [String],
      enum: ["STS", "HTS", "HTH", "STH"],
      required: true,
    },

    street: String,

    town: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "Town",
    },

    state: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "State",
    },

    country: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "Country",
    },

    status: {
      type: String,
      required: true,
      default: "new",
      enum: ["new", "verified"],
    },

    isOnline: Boolean,

    rating: {
      type: Number,
      default: 5.0,
    },

    emergencyContacts: [],

    stateOfOrigin: String,

    about: {
      type: String,
      max: 640,
    },
  },

  {
    timestamps: true,

    versionKey: false,
  }
);

userSchema.index({
  town: 1,
  country: 1,
  state: 1,
  gender: 1,
  roles: 1,
  banned: 1,
  suspended: 1,
  verified: 1,
  status: 1,
});
// userSchema.pre("save", async function (next) {
//   if (this.password && this.isModified(this.password)) {
//     this.hashPassword(this.password);
//   }
//   next();
// });

// userSchema.methods.hashPassword = async (currentPassword: string) => {
//   await bcrypt.hash(currentPassword, 12);
// };

// userSchema.methods.comparePassword = async (
//   existingPassword: string,
//   newPassword: string
// ) => {
//   return await bcrypt.compare(existingPassword, newPassword);
// };

const User: Model<IUser> = model<IUser>("User", userSchema);

export default User;
