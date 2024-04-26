import { MatchQuery, SortQuery } from "./../../types/types.d";
import { Request, Response } from "express";

import UserService, { UserServiceLayer } from "../services/userService";
import AppResponse from "../utils/helpers/AppResponse";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { IUser } from "../model/interfaces";

import AppError from "../middlewares/errors/BaseError";

import { ADMINROLES, USER } from "../config/enums";

class User {
  private user: UserService;

  constructor(userService: UserService) {
    this.user = userService;
  }

  async createUser(req: Request, res: Response) {
    const data: Required<
      Pick<IUser, "firstName" | "lastName" | "mobile" | "roles" | "countryCode">
    > & { deviceId: string } & Pick<
        IUser,
        | "fbId"
        | "appleId"
        | "googleId"
        | "googleEmail"
        | "appleEmail"
        | "fbEmail"
        | "deviceIds"
      > = req.body;

    const { deviceId, ...rest } = data;

    const newUser = {
      ...rest,
      verified: false,
      active: true,
    };

    //if this user is not created by an admin , add the new user device id
    if (data.roles === USER.driver || data.roles === USER.rider) {
      newUser.deviceIds = [deviceId];
    }

    const createdUser = await this.user.createUser(newUser);

    return AppResponse(req, res, StatusCodes.CREATED, {
      message: `User ${createdUser[0]._id} successfully created`,
    });
  }

  async getUsers(req: Request, res: Response) {
    const {
      userId,
      cursor,
      town,
      sort,
      state,
      country,
      role,
      status,
      verified,
      gender,
      suspended,
      banned,
    } = req.body;

    const matchQuery: MatchQuery = {
      _id: { $eq: userId },
    };

    if (cursor) {
      matchQuery._id = { $gt: cursor };
    }
    if (town) {
      // matchQuery.address = {} as Record<string, unknown>;
      (matchQuery.address as Record<string, unknown>).town = { $eq: town };
    }

    if (state) {
      (matchQuery.address as Record<string, unknown>).state = { $eq: state };
      matchQuery.state = { $eq: state };
    }

    if (country) {
      (matchQuery.address as Record<string, unknown>).country = {
        $eq: country,
      };
    }

    if (role) {
      matchQuery.roles = { $eq: role };
    }
    if (status) {
      matchQuery.status = { $eq: status };
    }

    if (verified) {
      matchQuery.verified = { $eq: Boolean(verified) };
    }

    if (suspended) {
      matchQuery.suspended = { $eq: Boolean(suspended) };
    }

    if (banned) {
      matchQuery.banned = { $eq: Boolean(banned) };
    }

    if (gender) {
      matchQuery.gender = { $eq: gender };
    }

    let sortQuery: SortQuery = {
      $sort: { createdAt: -1 },
    };

    if (sort) {
      const sortPattern = sort.toLowerCase().trim().split("_");

      const sortRange = sortPattern[1] === "desc" ? 1 : -1;

      sortQuery = {
        $sort: {
          [sortPattern[0]]: sortRange,
        },
      };
    }

    const aggregationData = [
      {
        $limit: 101, //The extra one is to check for another page
      },
      sortQuery,
    ];

    const result = await this.user.findUsers({
      query: matchQuery,
      aggregatePipeline: aggregationData,
      pagination: {
        pageSize: 100,
      },
    });

    const hasData = result?.data?.length === 0;

    return AppResponse(
      req,
      res,
      hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
      {
        message: hasData
          ? `Users retrieved succesfully`
          : `No users were found for this request `,
        data: result,
      }
    );
  }

  async getUserBasicInfo(req: Request, res: Response) {
    //the route validator will handle the error if it does not exist

    const userId: string = req.params.id;

    const select =
      "avatar firstName roles lastName about rating mobile countryCode address";

    const userData = await this.user.getUserById(userId, select);

    if (!userData)
      throw new AppError(
        getReasonPhrase(StatusCodes.NOT_FOUND),
        StatusCodes.NOT_FOUND
      );

    const {
      avatar,
      firstName,
      lastName,
      roles,
      rating,
      about,
      mobile,
      countryCode,
      address,
    } = userData;

    return AppResponse(req, res, StatusCodes.OK, {
      message: "User Basic info retrieved successfully",
      data: {
        avatar,
        firstName,
        roles,
        lastName,
        about,
        rating,
        countryCode,
        mobile,
        address,
      },
    });
  }

  //This should be in the admin route
  async limitUserAccount(req: Request, res: Response) {
    const data: {
      limitType: string;
      user: string;
      adminId: string;
      adminRole: ADMINROLES;
    } = req.body;

    const update: Pick<IUserModel, "banned" | "suspended" | "_id"> = {
      _id: data.user,
    };

    //Check the role about to be limited is not greater than the limiters role value
    const user = await this.user.getUserById(data.user, "roles");

    if (!user) throw new AppError("User not found", StatusCodes.NOT_FOUND);

    if (!data?.adminRole) {
      throw new AppError(
        "Invalid adminRole specified",
        StatusCodes.BAD_REQUEST
      );
    }

    const adminRoleValue = ADMINROLES[data.adminRole];

    if (!adminRoleValue) {
      throw new AppError(
        "Invalid adminRole specified",
        StatusCodes.BAD_REQUEST
      );
    }

    if (user.roles > parseInt(adminRoleValue)) {
      throw new AppError(
        "Insufficient permissions to limit user",
        StatusCodes.FORBIDDEN
      );
    }

    if (data.limitType === "ban") {
      update.banned = true;
    } else {
      update.suspended = true;
    }

    const limitedUser = await this.user.updateUser({
      docToUpdate: { _id: data.user },
      updateData: { $set: { ...update } },
      options: { new: true, select: "_id" },
    });

    return AppResponse(req, res, StatusCodes.OK, {
      message: `User ${data.user} account ${data.limitType} successfully `,
      data: {
        user: limitedUser,
      },
    });
  }

  async markUserAsVerified(req: Request, res: Response) {
    const data: Pick<IUserModel, "verified" | "_id"> = req.body;

    const update = { $set: { verified: true } };

    const verifiedUser = await this.user.updateUser({
      docToUpdate: { _id: data._id },
      updateData: update,
      options: { new: true, select: "_id" },
    });

    if (!verifiedUser)
      throw new AppError(
        getReasonPhrase(StatusCodes.NOT_FOUND),
        StatusCodes.NOT_FOUND
      );
    //if this errors out somehow , the global tryCatch will pick it up

    return AppResponse(req, res, StatusCodes.OK, {
      message: "User verified successfully",
      data: {
        user: verifiedUser._id,
      },
    });
  }

  async changeUserRole(req: Request, res: Response) {
    const data: Pick<IUserModel, "roles"> & {
      adminRole: number;
      userId: string;
    } = req.body;

    //TODO Implemet route guard that checks the allowed roles
    if (data.roles < data.adminRole)
      throw new AppError(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );

    const userWithUpdatedRole = await this.user.updateUser({
      docToUpdate: { _id: data.userId },
      updateData: {
        $set: {
          roles: data.roles,
        },
      },
      options: { new: true, select: "_id" },
    });

    return AppResponse(req, res, StatusCodes.OK, {
      message: "User role updated successfully",
      data: {
        user: userWithUpdatedRole,
      },
    });
  }

  async updateUserPeripheralData(req: Request, res: Response) {
    //update the about,emergency contacts, address and image

    type RequestDataType = Pick<
      IUser,
      "avatar" | "about" | "emergencyContacts"
    >;

    const data: RequestDataType & {
      user: string;
      image?: string;
      adminId: string;
    } = req.body;

    const updateData: { [K in keyof RequestDataType]: RequestDataType[K] } = {};

    if (data.about) {
      updateData.about = data.about;
    }
    if (data.emergencyContacts) {
      //Decided not to override the emergency contacts, instead add to the array , incase of an coordinated attempt at chaos and a deliberate attempt to erase traces of huaman connections
      updateData.emergencyContacts?.push(...data.emergencyContacts);
    }

    if (data?.image) {
      updateData.avatar = data.image;
    }

    const updatedUser = await this.user.updateUser({
      docToUpdate: {
        _id: data.adminId === data.user ? data.adminId : data.user,
      },
      updateData,
      options: { new: true, select: "_id" },
    });

    let message = "";

    Object.keys(data).forEach((key) => {
      // @ts-expect-error need to jump over the admin id key
      if (key === "adminId") break;

      message += `& ${key}`;
    });

    return AppResponse(req, res, StatusCodes.OK, {
      message: `User ${message} updated successfully`,
      data: {
        user: updatedUser?._id,
      },
    });
  }

  // async updateIdentityData(res: HttpResponse, req: HttpRequest) {
  //   //this updates driver license, residence

  //   type VerificationData = IUser["verificationData"];

  //   // Get all keys of VerificationData
  //   type AllVerificationDataKeys = keyof VerificationData;

  //   // Exclude the id key from AllVerificationDataKeys, since a user should never be able to update their id info after verifying it
  //   type RemainingVerificationDataKeys = Exclude<AllVerificationDataKeys, "id">;

  //   // Now use RemainingVerificationDataKeys to define IdentifierInfo
  //   type IdentifierInfo = {
  //     [K in RemainingVerificationDataKeys]: VerificationData[K];
  //   };
  //   // Read the JSON payload with the expected type including 'user' field
  //   const verificationDataRequest = await readJSON<
  //     IdentifierInfo & { user: string }
  //   >(res);

  //   // Fetch user data based on the provided user ID
  //   const users = await this.#getUsers(
  //     { _id: verificationDataRequest.user },
  //     "verificationData"
  //   );

  //   // Retrieve the verificationData of the first user (assuming it exists)
  //   const userIdentityData = users[0]?.verificationData;

  //   if (!userIdentityData) {
  //     //This should not happen but throw an error

  //     throw new AppError(
  //       getReasonPhrase(StatusCodes.BAD_REQUEST),
  //       StatusCodes.BAD_REQUEST
  //     );
  //   }

  //   // Prepare dataToUpdate object with initial values from userIdentityData
  //   const dataToUpdate: Partial<IdentifierInfo> = { ...userIdentityData };

  //   // Update dataToUpdate with values from verificationDataRequest
  //   Object.keys(verificationDataRequest).forEach((key) => {
  //     if (key in userIdentityData) {
  //       const typedKey = key as RemainingVerificationDataKeys; // Type assertion to the expected keys

  //       dataToUpdate[typedKey] = verificationDataRequest[typedKey];
  //     }
  //   });

  //   const updatedUserInfo = await this.#updateUser({
  //     _id: verificationDataRequest.user,
  //     update: {
  //       ...dataToUpdate,
  //       status: "pendingIdentityUpdateApproval",
  //     },
  //   });

  //   //if there is an error, the global handler will catch it

  //   return AppResponse(res, req, StatusCodes.OK, {
  //     message: "Identity update request sent successfully",
  //     data: { user: updatedUserInfo?._id },
  //   });
  // }

  //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  // async #getUsers<T extends Partial<IUserModel>>(data: T, select: string) {
  //   const query = { ...data };

  //   if (data?._id) {
  //     query["_id"] = data._id;
  //   }

  //   const users = await this.user.getUsers({
  //     query,
  //     select,
  //   });

  //   return users;
  // }

  // async #updateUser(data: UserUpdate) {
  //   const { _id, update } = data;

  //   const updatedUser = await this.user.updateUser({
  //     docToUpdate: { _id: { $eq: _id } },
  //     updateData: update,
  //     options: { new: true, select: "_id firstname " },
  //   });

  //   return updatedUser;
  // }

  // async #deleteUsers() {}

  // async #bulkUpdateUsers(res: HttpResponse, req: HttpRequest) {
  //   const data = await readJSON<AnyBulkWriteOperation<IUser>[]>(res);

  //   const operations = data;

  //   const result = await retryTransaction(this.user.bulkUpdateUser, 1, {
  //     operations,
  //   });

  //   return AppResponse(res, req, StatusCodes.OK, {
  //     insertedIds: result.data.insertedIds,
  //     upsertedIds: result.data.upsertedIds,
  //   });
  // }
}

export const UserController = new User(UserServiceLayer);

export default UserController;
