import { ROLES } from './../config/enums';

import { MatchQuery, SortQuery } from "./../../types/types.d";
import { Request, Response } from "express";

import UserService, { UserServiceLayer } from "../services/userService";
import AppResponse from "../utils/helpers/AppResponse";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { IUser } from "../model/interfaces";
import AppError from "../middlewares/errors/BaseError";





class User {
  private user: UserService;

  constructor(userService: UserService) {
    this.user = userService;
  }

  async createUser(req: Request, res: Response) {
    const data: Required<
      Pick<IUser, "firstName" | "lastName" | "mobile" | "roles" | "countryCode" | "subRole">
    > = req.body;

    const newUser = {
      ...data,
      verified: false,
      mobileVerified : false,
      active: true,
    };


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

      },
    });
  }

  //This should be in the admin route
  async limitUserAccount(req: Request, res: Response) {
    const data: {
      limitType: string;
      user: string;
  
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

    if (user.roles === parseInt(req.role) && (user?.subRole && user.subRole > req?.subRole )) {
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
    const data: Pick<IUser, "verified"> & { _id: string } = req.body;

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
    const data: Pick<IUser, "roles" | "subRole"> & {
      adminRole: number;
      userId: string;
    } = req.body;

    //TODO Implement route guard that checks the allowed roles
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
      "avatar" | "about" | "emergencyContacts" | "firstName" | "lastName" | "birthDate" | "deviceToken"
    >

    const data: RequestDataType & {
      user: string;
      image?: string;
      adminId: string;
    } = req.body;

    const updateData: { [K in keyof RequestDataType]: RequestDataType[K] } = {};

    if (data.about) {
      updateData.about = data.about;
    }

    if(data.deviceToken) { updateData.deviceToken =  data.deviceToken}

    if(data?.firstName){ 
      updateData.firstName =  data.firstName
    }

    if (data?.lastName) {
      updateData.lastName = data.lastName
    }
    if (data?.birthDate) {
      updateData.birthDate = data.birthDate
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

  // async setUserVerificationData  (req : Request, res : Response ) { 
  //   //This sets the 
  //   const data : { 
  //      firstName : string,
  //      lastName : string, 
  //      dateOfBirth : Date
  //   }

  // }


  async getUserStats(req: Request, res: Response) {

    const data: {
      dateFrom: Date,
      dateTo?: Date,
      status: Pick<IUser, "status">,
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
      matchQuery._idd = { $eq: data.userId };
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
                    // status: "$status"
                  },
                  count: { $sum: 1 }
                }
              },


            ],


            groupByGender: [

              {
                $group: {
                  _id: "gender",
                  count: { $sum: 1 }
                }
              }
            ],

            groupByRoles: [
              {
                $group: {
                  _id: "roles",
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
                  count: { $sum: { $cond: [{ $eq: ["$online", true] }, 1, 0] } }
                }
              },
              {
                $project: {
                  _id: 0,
                  count: 1
                }
              }
            ],

            initialStatusRatio: [
              {
                $group: {
                  _id: "$initialStatus",
                  count: { $sum: 1 }
                }
              }
            ]

          }

        }
      ],

    };

    //@ts-expect-error ts errors out on the $sort within the group user status BY ROLES

    const result = await this.user.aggregateUsers(query)

    return AppResponse(req, res, StatusCodes.OK, result)
    //Trip count, trip count by status,trip ratio 
  }

}



export const UserController = new User(UserServiceLayer);

export default UserController;
