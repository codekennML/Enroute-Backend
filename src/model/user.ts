import { Schema, Model, model, Document } from "mongoose";
import { IUser } from "./interfaces";
import bcrypt from "bcrypt";

export interface IUserModel extends IUser, Document {
  hashPassword(password: string): void;
  comparePassword(
    existingPassword: string,
    newPassword: string
  ): Promise<boolean>;
}

const userSchema = new Schema<IUserModel>(
  {
    firstName: {
      type: String,
      trim: true,
      max: 100,
    },

    email: {
      type: String,
      unique: true,
      max: 255,
      required: function () {
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

    subRole: {
      type: Number,
    },

    active: {
      type: Boolean,
      required: true,
      default: true,
    },

    mobile: {
      type: String,
      max: 13, // +2348105481234
      required: [true, "User Phone number is required"],
      index: true,
    },

    // deviceId: {
    //   type: String,
    //   index: true,
    // },

    avatar: {
      type: String,
      default: ".......a...s..s.",
      required: [true, "User avatar is required"],
    },

    gender: {
      type: String,
    },

    googleId: {
      type: String,
      index: true,
    },

    fbId: {
      type: String,
      index: true,
    },

    verifyHash: {
      type: String,
    },

    password: {
      type: String,
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

    hasSuppliedInfo: {
      type: Boolean,
      default: false,
      required: true,
    },

    resetTokenHash: {
      type: String,
      index: true,
    },

    resetTokenData: {
      expiry: Date,
      used: Boolean,
    },

    balance: {
      type: Number,
      required: true,
      default: 0,
    },

    paymentMethod: {
      authorization: Object,
      customer: Object,
    },

    refreshToken: {
      index: true,
      type: String,
    },

    userTransferRef: [
      {
        type: String,
      },
    ],

    lastLoginAt: Date,

    mobileAuthId: {
      type: String,
    },
  },

  {
    timestamps: true,

    versionKey: false,
  }
);

userSchema.pre("save", async function (next) {
  if (this.password && this.isModified(this.password)) {
    this.hashPassword(this.password);
  }
  next();
});

userSchema.methods.hashPassword = async (currentPassword: string) => {
  await bcrypt.hash(currentPassword, 12);
};

userSchema.methods.comparePassword = async (
  existingPassword: string,
  newPassword: string
) => {
  return await bcrypt.compare(existingPassword, newPassword);
};

const User: Model<IUserModel> = model<IUserModel>("User", userSchema);

export default User;
