import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import BusStationService, {
  BusStationServiceLayer,
} from "../services/busStationService";
import { Request, Response } from "express";
import { IBusStation } from "../model/interfaces";
import AppResponse from "../utils/helpers/AppResponse";
import { MatchQuery, SortQuery } from "../../types/types";
import { sortRequest } from "../utils/helpers/sortQuery";
import { Types } from 'mongoose'
import { ROLES } from "../config/enums";

class BusStationController {
  private busStation: BusStationService;

  constructor(service: BusStationService) {
    this.busStation = service;
  }

  createBusStation = async (req: Request, res: Response) => {
    const data: IBusStation = req.body;

    const createdBusStation = await this.busStation.createBusStation(data);

    return AppResponse(req, res, StatusCodes.CREATED, {
      message: "Bus station created successfully",
      data: createdBusStation,
    });
  }

  autocCompleteBusStations = async (req: Request, res: Response) => {


    const query = req.query.query as string


    const stations = await this.busStation.aggregateStations(
      {
        pipeline: [
          {
            $search: {
              index: "busstations", // Replace with your actual index name
              compound: {
                must: [
                  {
                    autocomplete: {
                      query,
                      tokenOrder: "sequential",
                      path: "name",
                      fuzzy: {
                        maxEdits: 1,
                        prefixLength: 1
                      }
                    }
                  }
                ],

              }
            }
          },
          {
            $limit: 5
          },
          {
            $lookup: {
              from: "towns",
              localField: "town",
              foreignField: "_id",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    name: 1
                  }
                }
              ],
              as: "town"
            }
          },
          {
            $unwind: "$town"
          },

          {
            $lookup: {
              from: "states",
              localField: "state",
              foreignField: "_id",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    name: 1
                  }
                }
              ],
              as: "state"
            }
          },
          {
            $unwind: "$state"
          },
          {
            $lookup: {
              from: "countries",
              localField: "country",
              foreignField: "_id",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    name: 1
                  }
                }
              ],
              as: "country"
            }
          },
          {
            $unwind: "$country"
          },
          {
            $project: {
              _id: 1,
              name: 1,
              town: "$town",
              state: "$state",
              country: "$country",
              coordinates: "$location.coordinates"
            }
          }
        ]
      }
    );

    if (stations.length === 0) {
      res.status(404).json({ message: 'No matching bus stations found' });
      return;
    }

    return AppResponse(req, res, StatusCodes.OK, {
      message: 'Bus stations retrieved successfully',
      data: stations
    })


  }

  suggestBusStation = async (req: Request, res: Response) => {

    const data: Omit<IBusStation, 'active' | 'suggested'> & { user: string } = req.body;


    const createdSuggestedBusStation = await this.busStation.createBusStation({ ...data, status: "suggested", suggestedBy: new Types.ObjectId(data.user) });

    return AppResponse(req, res, StatusCodes.CREATED, {
      message: "Bus station suggestion sent  successfully",
      data: createdSuggestedBusStation,
    });
  }

  considerSuggestedStation = async (req: Request, res: Response) => {

    const data: { stationId: string, decision: "approved" | "rejected" } = req.body

    const updatedStation = await this.busStation.updateBusStation({
      docToUpdate: {
        _id: { $eq: data.stationId }
      },
      updateData: {
        $set: {
          ...(data.decision === "approved" && { status: "active", approvedBy: req.user }),
          ...(data.decision === "rejected" && { status: "rejected", approvedBy: req.user })
        }
      },
      options: { new: true, select: "_id" }
    })

    if (!updatedStation) throw new AppError("An Error occured. Please try again", StatusCodes.INTERNAL_SERVER_ERROR)

    return AppResponse(req, res, StatusCodes.OK, { message: "Station has been approved successfully", data: { _id: updatedStation._id } })
  }

  getBusStations = async (req: Request, res: Response) => {
    const data: {
      stationId: string;
      dateFrom?: Date;
      dateTo?: Date;
      cursor?: string;
      town?: string;
      state?: string;
      country?: string;
      sort?: string;
      isMain?: boolean
      coordinates: [number, number]
      active: boolean;
    } = req.body;

    const matchQuery: MatchQuery = {};

    if (data?.stationId) {
      matchQuery._id = { $eq: data?.stationId };
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

    if (data?.active) {
      matchQuery.active = { $eq: data.active };
    }

    if (req.role in [ROLES.RIDER, ROLES.DRIVER]) {
      matchQuery.active = { $eq: true };
    }

    if (data?.dateFrom) {
      matchQuery.createdAt = { $gte: new Date(data.dateFrom), $lte: data?.dateTo ?? new Date(Date.now()) };
    }

    const sortQuery: SortQuery = sortRequest(data?.sort);

    if (data?.cursor) {
      const orderValue = Object.values(sortQuery)[0] as unknown as number;

      const order =
        orderValue === 1 ? { $gt: data.cursor } : { $lt: data?.cursor };

      matchQuery._id = order;
    }

    const query = {
      query: matchQuery,
      aggregatePipeline: [{ $limit: 101 }, sortQuery],
      pagination: { pageSize: 100 },
    };

    const result = await this.busStation.findBusStations(query);

    const hasData = result?.data?.length === 0;

    return AppResponse(
      req,
      res,
      hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
      {
        message: hasData
          ? `Stations retrieved succesfully`
          : `No stations were found for this request `,
        data: result,
      }
    );
  }

  getInitialBusStations = async (req: Request, res: Response) => {
    const { lat, lng, state, country } = req.query;
    const matchQuery: MatchQuery = {};
    console.log(req.query, "Params")

    if (state) {
      matchQuery.state = { $eq: state };
    }
    if (country) {
      matchQuery.country = { $eq: new Types.ObjectId(country as string) };
    }

    const lookups = [
      {
        $limit: 5
      },
      {
        $lookup: {
          from: "towns",
          localField: "town",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1
              }
            }
          ],
          as: "town"
        }
      },
      {
        $unwind: "$town"
      },

      {
        $lookup: {
          from: "states",
          localField: "state",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1
              }
            }
          ],
          as: "state"
        }
      },
      {
        $unwind: "$state"
      },

      {
        $lookup: {
          from: "countries",
          localField: "country",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1
              }
            }
          ],
          as: "country"
        }
      },
      {
        $unwind: "$country"
      },
      {
        $project: {
          _id: 1,
          name: 1,
          town: "$town",
          state: "$state",
          country: "$country",
          coordinates: "$location.coordinates",
          distance: "$dist.calculated"
        }
      }
    ]

    let stations = []

    if (lat && lng) {
      stations = await this.busStation.aggregateStations({
        pipeline: [
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: [parseFloat(lng as string), parseFloat(lat as string)]
              }, // Ensure lat/lng are numbers
              query: { status: "active" },
              distanceField: "dist.calculated",
              maxDistance: 50000,
              spherical: true,
            }
          },
          ...lookups
        ]
      })
    }

    // If no stations are found by location, search by state and country with the isPopular flag
    if (stations.length === 0) {
      matchQuery.isPopular = { $eq: true }; // Add the isPopular flag to the query
      matchQuery.status = { $eq: "active" }

      console.log(matchQuery, "Vinene")

      stations = await this.busStation.aggregateStations({
        pipeline: [
          {
            $match: matchQuery
          },
          ...lookups
        ]
      });
    }

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Initial stations retrieved successfully",
      data: stations
    })
  }


  getBuStationById = async (req: Request, res: Response) => {
    const stationId: string = req.params.id;

    const result = await this.busStation.getBusStationById(stationId);



    if (!result)
      throw new AppError(
        "No station was found for this request",
        StatusCodes.NOT_FOUND
      );

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Bus station retrieved successfully",
      data: result,
    });
  }

  updateBusStation = async (req: Request, res: Response) => {
    const data: IBusStation & { stationId: string } = req.body;

    console.log("Station Data", data)
    const { stationId, ...rest } = data;

    const updatedStation = await this.busStation.updateBusStation({
      docToUpdate: { _id: { $eq: stationId } },
      updateData: {
        $set: {
          ...rest,
        },
      },
      options: {
        new: true,
        select: "_id placeId",
      },
    });

    if (!updatedStation)
      throw new AppError(
        "Error : Update to bus station failed",
        StatusCodes.NOT_FOUND
      );



    return AppResponse(req, res, StatusCodes.OK, {
      message: "Bus station updated successfully",
      data: updatedStation,
    });
  }

  //Admins only
  deleteBusStations = async (req: Request, res: Response) => {
    const data: { busStationIds: string[] } = req.body;

    const { busStationIds } = data;

    if (busStationIds.length === 0)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const deletedBusStations = await this.busStation.deleteBusStations(
      busStationIds
    );

    return AppResponse(req, res, StatusCodes.OK, {
      message: `${deletedBusStations.deletedCount} bus stations deleted.`,
    });
  }

  bulkUpdateStations = async (req: Request, res: Response) => {
    const data: { busStationIds: string[], update: Record<string, boolean | string> } = req.body;

    console.log(data, "Mioai")

    const { busStationIds } = data;

    if (busStationIds.length === 0)
      throw new AppError(
        getReasonPhrase(StatusCodes.BAD_REQUEST),
        StatusCodes.BAD_REQUEST
      );

    const objectIds = busStationIds.map(station => new Types.ObjectId(station))

    const operations = [{
      updateMany: {
        filter: {
          _id: { $in: objectIds }
        },
        update: {
          $set: { ...data.update }
        }
      }
    }]

    console.log(JSON.stringify(operations), "Here")

    const deletedBusStations = await this.busStation.bulkWriteBusStations({ operations })

    return AppResponse(req, res, StatusCodes.OK, {
      message: `${deletedBusStations.modifiedCount} bus stations updated.`,
    });
  }


  getBusStationStats = async (req: Request, res: Response) => {

    const data: {
      country?: string,
      state?: string,
      town?: string,

    } = req.body

    const matchQuery: MatchQuery = {
      // createdAt: { $gte: new Date(data.dateFrom), $lte: data?.dateTo ?? new Date(Date.now()) }
    };

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
        // { $match: matchQuery },
        {
          $facet: {
            count: [{ $count: "total" }],
            getStationCountByStatus: [
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 }
                }
              }
            ]

          }
        }
      ]
    };

    //@ts-expect-error //ts doesnt recognize the stage correctly
    const result = await this.ride.aggregateRides(query)

    return AppResponse(req, res, StatusCodes.OK, result)


  }



}

export const BusStation = new BusStationController(BusStationServiceLayer);

export default BusStation;
