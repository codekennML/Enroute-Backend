import { getUserBasicInfo } from './../routes/schemas/user';
import { Types } from 'mongoose';
import { ROLES } from './../config/enums';

import { MatchQuery, SortQuery } from "./../../types/types.d";
import { Request, Response } from "express";

import UserService, { UserServiceLayer } from "../services/userService";
import AppResponse from "../utils/helpers/AppResponse";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { IUser } from "../model/interfaces";
import AppError from "../middlewares/errors/BaseError";
import { emailQueue } from '../services/bullmq/queue';
import { COMPANY_NAME, COMPANY_SLUG } from '../config/constants/base';
import { AdminInviteMail } from '../views/mails/AdminInvite';
import { checkUserCanAuthenticate } from '../utils/helpers/canLogin';




class User {
  private user: UserService;

  constructor(userService: UserService) {
    this.user = userService;
  }

  createUser = async (req: Request, res: Response) => {
    const data: Required<
      Pick<IUser, "firstName" | "lastName" | "email" | "roles" | "subRole">
    > = req.body;

    const newUser = {
      ...data,
      verified: true,
      active: true,
      status: "verified",
      invitedBy: new Types.ObjectId(req.user)
    };

    //Chck if email exists in the db

    const isExistingUser = await UserServiceLayer.getUsers({
      query: { email: data.email },
      select: "_id"
    })

    if (!isExistingUser) throw new AppError("An Error occurred. Please try again", StatusCodes.INTERNAL_SERVER_ERROR)

    if (isExistingUser.length > 0) throw new AppError("A user exists with the same account data", StatusCodes.CONFLICT)

    const createdUser = await this.user.createUser(newUser);

    if (!createdUser) throw new AppError("An Error occurred. Please try again", StatusCodes.INTERNAL_SERVER_ERROR)

    const mail = AdminInviteMail(data.firstName)

    emailQueue.add(`New User Invite-${createdUser}`, {
      to: data.email,
      subject: `${COMPANY_NAME} Account Invitation`,
      template: mail,
      from: `info@${COMPANY_SLUG}`
    }, {
      priority: 6
    })

    return AppResponse(req, res, StatusCodes.CREATED, {
      message: `User ${createdUser[0]._id} successfully created`,
    });
  }

  getUserBasicInfo = async (req: Request, res: Response) => {
    //the route validator will handle the error if it does not exist

    const userId: string = req.params.id

    const select =
      "avatar firstName roles lastName mobile countryCode email subRole verified suspended banned _id email googleEmail  ";

    console.log(req.user, userId)

    if (userId !== req.user && (req.role === ROLES.RIDER || req.role === ROLES.DRIVER)) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)



    const userData = await this.user.getUserById(userId, select);

    if (!userData)
      throw new AppError(
        getReasonPhrase(StatusCodes.NOT_FOUND),
        StatusCodes.NOT_FOUND
      );

    checkUserCanAuthenticate(userData)

    const {
      avatar,
      firstName,
      lastName,
      roles,
      mobile,
      countryCode,
      banned,
      suspended,
      _id,
      deviceToken,
      email,
      googleEmail,
      verified
    } = userData;

    return AppResponse(req, res, StatusCodes.OK, {
      message: "User info validated successfully",
      data: {
        avatar,
        firstName,
        roles,
        lastName,
        banned,
        suspended,
        countryCode,
        mobile,
        _id,
        email: email || googleEmail,
        deviceToken,
        verified
      },
    });
  }

  getUsers = async (req: Request, res: Response) => {
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
    } = req.query;

    const matchQuery: MatchQuery = {

    };
    if (userId) {
      matchQuery._id = { $eq: userId }
    }


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
      const sortPattern = (sort as string).toLowerCase().trim().split("_");

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
      {
        $project: { refreshToken: 0 }
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

    const hasData = result?.data?.length > 0

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

  // getUserBasicInfo = async (req: Request, res: Response) => {
  //   //the route validator will handle the error if it does not exist

  //   const userId: string = req.params.id;

  //   const select =
  //     "avatar firstName roles lastName about rating mobile countryCode address email roles subRole verified ";

  //   //The only users that shold be able to access other users data should be admins 
  //   if (userId !== req.user && (req.role === ROLES.RIDER || req.role === ROLES.DRIVER)) throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)


  //   const userData = await this.user.getUserById(userId, select);
  //   if (!userData)
  //     throw new AppError(
  //       getReasonPhrase(StatusCodes.NOT_FOUND),
  //       StatusCodes.NOT_FOUND
  //     );

  //   const {
  //     avatar,
  //     firstName,
  //     lastName,
  //     roles,
  //     rating,
  //     about,
  //     mobile,
  //     countryCode,

  //   } = userData;

  //   return AppResponse(req, res, StatusCodes.OK, {
  //     message: "User Basic info retrieved successfully",
  //     data: {
  //       avatar,
  //       firstName,
  //       roles,
  //       lastName,
  //       about,
  //       rating,
  //       countryCode,
  //       mobile,

  //     },
  //   });
  // }

  //This should be in the admin route
  async limitUserAccount(req: Request, res: Response) {
    const data: {
      limitType: string;
      user: string;
      limitReason: string,


    } = req.body;

    const update: Partial<Pick<IUser, "banned" | "suspended">> & { _id: string } = {
      _id: data.user,
    };

    //Check the role about to be limited is not greater than the limiters role value
    const user = await this.user.getUserById(data.user, "roles subRole");

    if (!user) throw new AppError("User not found", StatusCodes.NOT_FOUND);

    if (!req.role) {
      throw new AppError(
        "Invalid adminRole specified",
        StatusCodes.BAD_REQUEST
      );
    }

    if (user.roles > req.role || req.role in [ROLES.DRIVER, ROLES.RIDER]) throw new AppError(
      "Insufficient permissions to limit user",
      StatusCodes.FORBIDDEN
    );

    if (!(user.roles in [ROLES.ADMIN, ROLES.SUPERADMIN]) && req.role in [ROLES.DEV, ROLES.CX, ROLES.ACCOUNT, ROLES.MARKETING, ROLES.SALES]) throw new AppError(
      "Insufficient permissions to limit user",
      StatusCodes.FORBIDDEN
    );

    if (user.roles === req.role && (user?.subRole && user.subRole > req?.subRole)) {
      throw new AppError(
        "Insufficient permissions to limit user",
        StatusCodes.FORBIDDEN
      );
    }


    if (req.role !== ROLES.SUPERADMIN && req.role !== ROLES.ADMIN && req.role !== ROLES.CX && req.role !== ROLES.DEV && (user.roles === ROLES.DRIVER || user.roles === ROLES.RIDER)) throw new AppError(
      "Insufficient permissions to perform this action",
      StatusCodes.FORBIDDEN
    );

    if (data.limitType === "ban") {
      update.banned = true;
    } else {
      update.suspended = true;
    }

    const limitedUser = await this.user.updateUser({
      docToUpdate: { _id: data.user },
      updateData: { $set: { ...update, limitReason: data.limitReason, limitedBy: req.user } },
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
    const data: { _id: string } = req.body;

    const update = { $set: { verified: true } };

    const verifiedUser = await this.user.updateUser({
      docToUpdate: { _id: data._id },
      updateData: update,
      options: { new: true, select: "_id" },
    });

    if (!verifiedUser)
      throw new AppError(
        "An Error occurred. Pleas try again",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    //if this errors out somehow , the global tryCatch will pick it up

    return AppResponse(req, res, StatusCodes.OK, {
      message: "User verified successfully",
      data: {
        user: verifiedUser._id,
      },
    });
  }

  // async changeUserRole(req: Request, res: Response) {
  //   const data: Pick<IUser, "roles" | "subRole"> & {
  //     userId: string;
  //   } = req.body;



  //   if (data.roles < data.adminRole)
  //     throw new AppError(
  //       getReasonPhrase(StatusCodes.FORBIDDEN),
  //       StatusCodes.FORBIDDEN
  //     );

  //   const userWithUpdatedRole = await this.user.updateUser({
  //     docToUpdate: { _id: data.userId },
  //     updateData: {
  //       $set: {
  //         roles: data.roles,
  //       },
  //     },
  //     options: { new: true, select: "_id" },
  //   });

  //   return AppResponse(req, res, StatusCodes.OK, {
  //     message: "User role updated successfully",
  //     data: {
  //       user: userWithUpdatedRole,
  //     },
  //   });
  // }

  updateUserPeripheralData = async (req: Request, res: Response) => {
    //update the about,emergency contacts, address and image

    type RequestDataType = Partial<Pick<
      IUser,
      "about" | "emergencyContacts" | "firstName" | "lastName" | "birthDate" | "deviceToken" | "country" | "state" | "town" | "serviceType" | "dispatchType"
    >>

    const data: RequestDataType & {
      image?: string;
      _id: string
    } = req.body;

    const currentUser = await this.user.getUserById(req.user!, "roles subRole")

    if (!currentUser) throw new AppError(getReasonPhrase(StatusCodes.NOT_FOUND), StatusCodes.NOT_FOUND)

    const userToUpdate = await this.user.getUserById(req.user!, "roles subRole")

    if (!userToUpdate) throw new AppError(getReasonPhrase(StatusCodes.NOT_FOUND), StatusCodes.NOT_FOUND)



    if (data._id !== req.user || userToUpdate.roles > currentUser.roles || userToUpdate?.subRole || 0 > (currentUser?.subRole || 0)) {
      throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)
    }


    const updateData: Record<string, Record<string, RequestDataType[keyof RequestDataType]>> = { $set: {} }

    console.log(updateData)
    if (data?.about) {
      updateData['$set'] = { ...updateData.$set, about: data.about }
    }
    console.log(updateData)
    if (data?.country) {
      updateData['$set']["country"] = data.country;
    }
    if (data?.state) {
      updateData['$set']["state"] = data.state;
    }
    if (data?.town) {
      updateData['$set']["town"] = data.town;
    }
    if (data?.serviceType) {
      updateData['$set']["serviceType"] = data.serviceType;
    }
    if (data?.dispatchType) {
      updateData['$set']["dispatchType"] = data.dispatchType;
    }

    if (data?.deviceToken) { updateData['$set']["deviceToken"] = data.deviceToken }

    if (data?.firstName) {
      updateData['$set']['firstName'] = data.firstName
    }

    if (data?.lastName) {
      updateData['$set']['lastName'] = data.lastName
    }
    if (data?.birthDate) {
      updateData['$set']['birthDate'] = data.birthDate

      //TODO : Check to see if there is a need to impose a age limit of 18
    }

    if (data.emergencyContacts) {
      //Decided not to override the emergency contacts, instead add to the array , incase of  deliberate attempts to erase traces of huaman connections
      updateData["$push"]['emergencyContacts'] = data.emergencyContacts
    }



    if (data?.image) {
      updateData['$set']['avatar'] = data.image;
    }
    console.log(req.user, updateData)

    const updatedUser = await this.user.updateUser({
      docToUpdate: {
        _id: { $eq: data._id }
      },
      updateData,
      options: { new: true, select: "_id" },
    });


    if (!updatedUser) throw new AppError("An error occurred. Please try again", StatusCodes.INTERNAL_SERVER_ERROR)

    let message = "";

    Object.keys(data).forEach((key) => {
      message += ` & ${key}`;
    });

    return AppResponse(req, res, StatusCodes.OK, {
      message: `User ${message} updated successfully`,
      data: {
        user: updatedUser?._id,
      },
    });
  }


  getUserStats = async (req: Request, res: Response) => {
    console.log("Errere")

    const data: {
      dateFrom?: Date,
      dateTo?: Date,
      status?: Pick<IUser, "status">,
      country?: string,
      state?: string,
      town?: string,
      userId?: string
    } = req.body

    const matchQuery: MatchQuery = {

    };

    if (data?.dateFrom) {
      matchQuery.createdAt = { $gte: new Date(data.dateFrom), $lte: data?.dateTo ?? new Date(Date.now()) };
    }

    if (data?.userId) {
      matchQuery._id = { $eq: data.userId };
    }

    if (data?.country) {
      matchQuery.country = { $eq: data?.country };
    }

    if (data?.state) {
      matchQuery.state = { $eq: data?.state };
    }

    if (data?.town) {
      matchQuery.town = { $eq: data?.town };
    }


    const query = {

      pipeline: [
        {
          $match: matchQuery
        },
        {
          $facet: {
            count: [{ $count: "total" }],


            ageBracketUsersByGender: [
              {
                $project: {
                  gender: 1,
                  age: {
                    $divide: [
                      {
                        $subtract: [new Date(), "$birthDate"]
                      },
                      1000 * 60 * 60 * 24 * 365 // Convert milliseconds to years
                    ]
                  }
                }
              },
              {
                $project: {
                  gender: 1,
                  age: { $floor: "$age" }, // Round down to the nearest integer
                  ageBracket: {
                    $switch: {
                      branches: [
                        {
                          case: {
                            $and: [
                              { $eq: ["$gender", "male"] },
                              { $lte: ["$age", 19] }
                            ]
                          },
                          then: "0-19"
                        },
                        {
                          case: {
                            $and: [
                              { $eq: ["$gender", "male"] },
                              { $and: [{ $gt: ["$age", 19] }, { $lte: ["$age", 40] }] }
                            ]
                          },
                          then: "20-40"
                        },
                        {
                          case: {
                            $and: [
                              { $eq: ["$gender", "male"] },
                              { $gt: ["$age", 40] }
                            ]
                          },
                          then: ">40"
                        },
                        {
                          case: {
                            $and: [
                              { $eq: ["$gender", "female"] },
                              { $lte: ["$age", 19] }
                            ]
                          },
                          then: "0-19"
                        },
                        {
                          case: {
                            $and: [
                              { $eq: ["$gender", "female"] },
                              { $and: [{ $gt: ["$age", 19] }, { $lte: ["$age", 40] }] }
                            ]
                          },
                          then: "20-40"
                        },
                        {
                          case: {
                            $and: [
                              { $eq: ["$gender", "female"] },
                              { $gt: ["$age", 40] }
                            ]
                          },
                          then: ">40"
                        }
                      ],
                      default: "Unknown"
                    }
                  }
                }
              },
              {
                $group: {
                  _id: { ageBracket: "$ageBracket", gender: "$gender" },
                  count: { $sum: 1 }
                }
              },
              {
                $project: {
                  _id: 0,
                  ageBracket: "$_id.ageBracket",
                  gender: "$_id.gender",
                  count: 1
                }
              }
            ],

            groupByMonthOfYear: [
              {
                $group: {
                  _id: {
                    month: { $month: "$createdAt" },
                    status: "$status"
                  },
                  count: { $sum: 1 }
                }
              },


            ],


            groupByGender: [

              {
                $group: {
                  _id: "$gender",
                  count: { $sum: 1 }
                }
              }
            ],

            groupByRoles: [
              {
                $group: {
                  _id: "$roles",
                  count: { $sum: 1 }
                }
              }
            ],


            groupUserStatusByRoles: [
              {
                $project: {
                  role: 1,
                  active: { $cond: [{ $eq: ["$active", true] }, "active", null] },
                  suspended: { $cond: [{ $eq: ["$suspended", true] }, "suspended", null] },
                  banned: { $cond: [{ $eq: ["$banned", true] }, "banned", null] }
                }
              },
              {
                $project: {
                  role: 1,
                  status: {
                    $cond: [
                      { $eq: ["$active", "active"] },
                      "active",
                      { $cond: [{ $eq: ["$suspended", "suspended"] }, "suspended", "banned"] }
                    ]
                  }
                }
              },
              {
                $group: {
                  _id: {
                    role: "$role",
                    status: "$status"
                  },
                  count: { $sum: 1 }
                }
              },
              {
                $project: {
                  _id: 0,
                  role: "$_id.role",
                  status: "$_id.status",
                  count: 1
                }
              },
              {
                $sort: {
                  role: 1,
                  status: 1
                }
              }
            ],


            status: [
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 }
                }
              }
            ],

            usersByStatus: [
              {
                $group: {
                  _id: null,
                  activeUsers: { $sum: { $cond: [{ $eq: ["$active", true] }, 1, 0] } },
                  suspendedUsers: { $sum: { $cond: [{ $eq: ["$suspended", true] }, 1, 0] } },
                  bannedUsers: { $sum: { $cond: [{ $eq: ["$banned", true] }, 1, 0] } },
                  verifiedUsers: { $sum: { $cond: [{ $eq: ["$verified", true] }, 1, 0] } }
                }
              },
              {
                $project: {
                  _id: 0,
                  activeUsers: 1,
                  suspendedUsers: 1,
                  bannedUsers: 1,
                  verifiedUsers: 1
                }
              }
            ],

            // usersCountByStateOfOrigin: [
            //   {
            //     $group: {
            //       _id: "$stateOfOrigin",
            //       count: { $sum: 1 }
            //     }
            //   },
            //   {
            //     $sort: { count: -1 }
            //   },
            //   {
            //     $limit: 10
            //   }
            // ],

            onlineUsers: [
              {
                $group: {
                  _id: null,
                  count: { $sum: { $cond: [{ $gt: ["$accessTokenExpiresAt", new Date(Date.now())] }, 1, 0] } }
                }
              },
              {
                $project: {
                  _id: 0,
                  count: 1
                }
              }
            ],

            // initialStatusRatio: [
            //   {
            //     $group: {
            //       _id: "$initialStatus",
            //       count: { $sum: 1 }
            //     }
            //   }
            // ]

          }

        }
      ],

    };


    //@ts-expect-error ts errors out on the $sort within the group user status BY ROLES

    const result = await this.user.aggregateUsers(query)
    console.log("result", JSON.stringify(result))

    return AppResponse(req, res, StatusCodes.OK, {
      message: "User statistics retrieved successfully",
      data: result
    })
    //Trip count, trip count by status,trip ratio 
  }

}

export const UserController = new User(UserServiceLayer);

export default UserController;
