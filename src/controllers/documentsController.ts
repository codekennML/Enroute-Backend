
import { ClientSession, Types } from "mongoose";
import DocumentsService, {
  DocumentsServiceLayer,
} from "../services/documentsService";
import AppResponse from "../utils/helpers/AppResponse";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { Request, Response } from "express";
import { retryTransaction } from "../utils/helpers/retryTransaction";
// import { UserServiceLayer } from "../services/userService";
import AppError from "../middlewares/errors/BaseError";
// import { VehicleServiceLayer } from "../services/vehicleService";
import { MatchQuery, SortQuery } from "../../types/types";
import { sortRequest } from "../utils/helpers/sortQuery";
import Vehicle from "../model/vehicles";

class DocumentsController {
  private documents: DocumentsService;

  constructor(service: DocumentsService) {
    this.documents = service;
  }

  async createUserDocuments(req: Request, res: Response) {
    //This creates documents that are linked from the user model and
    const {
      name,
      user,
      imageUrl,
      verificationResponse,
      expiry,
      issued,
      fieldData,
      vehicleId,
    } = req.body;
    //Field data contains the data we need to push into the user or vehicle model when the document is approved

    const createdDocument = await this.documents.createDocuments({
      name,
      userId: new Types.ObjectId(user),
      vehicleId: vehicleId ? new Types.ObjectId(vehicleId) : undefined,
      imageUrl,
      verificationResponse,
      expiry,
      issued,
      fieldData,
      status: "pending",
      archived : false ,
      isRejected : false
    });

    return AppResponse(req, res, StatusCodes.OK, { createdDocument });
  }

  async findDocuments(req: Request, res: Response) {
    const data: {
      isVerified?: boolean;
      status?: "pending" | "assessed";
      cursor?: string;
      sort?: string;
      name?: string;
      user?: string;
    } = req.params;

    const sortQuery: SortQuery = sortRequest(data?.sort);

    const matchQuery: MatchQuery = {};

    if (data?.user) {
      matchQuery._id = { $eq: data.user };
    }

    if (data?.isVerified) {
      matchQuery.isVerified = { $eq: true };
    }
    if (data?.status) {
      matchQuery.status = { $eq: data.status };
    }
    if (data?.name) {
      //This is the name of th document
      matchQuery.name = { $eq: data.name };
    }

    if (data?.cursor) {
      const orderValue = Object.values(sortQuery)[0] as unknown as number;

      const order =
        orderValue === 1 ? { $gt: data.cursor } : { $lt: data?.cursor };

      matchQuery._id = order;
    }

    if (data?.status) {
      matchQuery.status = { $eq: data.status };
    }

    const result = await this.documents.findDocuments({
      query: matchQuery,
      aggregatePipeline: [
        sortQuery,
        { $limit: 101 },
        {
          $lookup: {
            from: "users",
            foreignField: "_id",
            localField: "userId",
            pipeline: [
              {
                $project: {
                  firstname: 1,
                  lastname: 1,
                  _id: 1,
                },
              },
            ],
            as: "$user",
          },
        },
        { $unwind: "$$user" },
        {
          $lookup: {
            from: "vehicles",
            foreignField: "_id",
            localField: "vehicleId",
            pipeline: [
              {
                $project: {
                  vehicleModel: 1,
                  vehicleMake: 1,
                  _id: 1,
                },
              },
            ],
            as: "$vehicle",
          },
        },
      ],
      pagination: { pageSize: 100 },
    });

    const hasData = result?.data?.length === 0;

    return AppResponse(
      req,
      res,
      hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
      {
        message: hasData
          ? `Documents retrieved retrieved succesfully`
          : `No documents were found for this request `,
        data: result,
      }
    );
  }

  //Get a users pending documents
  async getPendingDocumentsByUser(req: Request, res: Response) {
   
    const data: { cursor?: string, user : string } = req.params;

    const matchQuery: MatchQuery = { userId : { $eq : data.user}, status: { $eq: "pending" } };

    if (data?.cursor) matchQuery._id = { $lt: data.cursor };

    const result = await this.documents.findDocuments({
      query: matchQuery,
      aggregatePipeline: [
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: "_id",
          },
        },
        {
          $lookup: {
            from: "users",
            foreignField: "_id",
            localField: "userId",
            pipeline: [
              {
                $project: {
                  firstname: 1,
                  lastname: 1,
                  _id: 1,
                },
              },
            ],
            as: "$user",
          },
        },
        { $unwind: "$$user" },
        {
          $lookup: {
            from: "vehicles",
            foreignField: "_id",
            localField: "vehicleId",
            pipeline: [
              {
                $project: {
                  vehicleModel: 1,
                  vehicleMake: 1,
                  _id: 1,
                },
              },
            ],
            as: "$vehicle",
          },
        },
        {
          $unwind: {
            path: "$$vehicle",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$user._id", // Group documents by user ID
            user: { $first: "$user" }, // Keep the user details
            pendingDocuments: { $push: "$$ROOT" }, // Collect all pending documents for each user
          },
        },
        {
          $project: {
            _id: 0, // Exclude the group ID from the final output (optional)
            user: 1, // Include the user details in the output
            pendingDocuments: 1, // Include the array of pending documents in the output
          },
        },
      ],
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
          ? `Documents retrieved succesfully`
          : `No documents were found for this request `,
        data: result,
      }
    );
  }

  //Generic find method to fetch any document by Id
  async findDocumentsById(req: Request, res: Response) {
    const documentId: string = req.params.id;

    const document = await this.documents.getDocumentById({
      query: { _id: documentId },
    });

    if (!document) return AppResponse(req, res, StatusCodes.NOT_FOUND, {});

    return AppResponse(req, res, StatusCodes.OK, {
      message: "Document retrived successfully",
      data: document,
    });
  }

  //Mark a document as approved
  async markDocumentApproved(req: Request, res: Response) {
    const data: { documentId: string; adminId: string } = req.body;

    // const vehicleInfo = ["insurance", "inspection"];

    const approveDocumentSessionFn = async (
      args: typeof data,
      session: ClientSession
    ) => {
      await session.withTransaction(async () => {
        const approvedDocument = await this.documents.updateDocument({
          docToUpdate: { _id: args.documentId },
          updateData: {
            $set: {
              isRejected: false,
              status: "assessed",
              isVerified: true,
              approvedBy: new Types.ObjectId(data.adminId),
            },
          },
          options: { session, new: true, select: "fieldData _id name userId" },
        });
        if (!approvedDocument)
          throw new AppError(
            getReasonPhrase(StatusCodes.NOT_FOUND),
            StatusCodes.NOT_FOUND
          );

        //Lastly check if there is any document with the same name and and a status of assessed and not rejected and not archived and archive that document so this becomes the only active document for that result
         await this.documents.updateDocument({
          docToUpdate: { userId : approvedDocument.userId,  status : "assessed", archived : false, isRejected : false, isVerified : true  , _id : { $ne : approvedDocument._id}, name : { $eq : approvedDocument.name}},
          updateData: {
            $set: {
             
             archived : true
            },
          },
          options: { session, new: true, select: "fieldData _id name userId" },
        });
//This can  be null and its okay 
        
        //Update the user data with the approved document id
       
        //Update the vehicleInfo if the changed or approved document belongs to the vehicle model , not the user model
        // if (vehicleInfo.includes(approvedDocument.name.toUpperCase())) {
        //   await VehicleServiceLayer.updateVehicle({
        //     docToUpdate: { _id: approvedDocument.userId },
        //     updateData: {
        //       $set: {
        //         [approvedDocument.name]: approvedDocument?._id,
              
        //       },
        //     },
        //     options: { session, select: "_id" },
        //   });
        // }

     
        return args.documentId;
      });
    };

    await retryTransaction(approveDocumentSessionFn, 1, data);

    return AppResponse(req, res, StatusCodes.OK, {
      message: `Document with id ${data.documentId} updated successfully`,
    });
  }

  //This fetches all documents by a user that have not been archived, meaning they are active -either rejected, verified or undergoing verification
  async getUserVerificationDocuments(req: Request, res: Response) {
    const userId = req.params.id;

    const results = await this.documents.getDocumentsWithPopulate({
      query: { userId: { $eq: userId }, archived: { $eq: false } },
      select:
        "name status imageUrl issued expiry rejectionFeedback isVerified vehicleId",
      populatedQuery: [
        {
          path: "vehicle",
          select: "vehicleMake vehicleModel isVerified isArchived",
          model: Vehicle,
        },
      ],
    });

    const hasData = results?.length === 0;

    return AppResponse(
      req,
      res,
      hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
      {
        message: hasData
          ? `User documents  retrieved succesfully`
          : `No documents were found for this request `,
        data: results,
      }
    );
  }

  async markDocumentRejected(req: Request, res: Response) {
    const data: { documentId: string; rejectionFeedback: string } = req.body;

    const rejectDocumentSessionFn = async (
      args: typeof data,
      session: ClientSession
    ) => {
      await session.withTransaction(async () => {
        const rejectedDocument = await this.documents.updateDocument({
          docToUpdate: { _id: args },
          updateData: {
            $set: {
              isRejected: true,
              status: "assessed",
              isVerified: false,
              rejectionFeedback: args.rejectionFeedback,
            },
          },
          options: { session, new: true, select: "_id" },
        });
    //TODO : May make sense to send a rejection feedback email here 
        if (!rejectedDocument)
          throw new AppError(
            getReasonPhrase(StatusCodes.NOT_FOUND),
            StatusCodes.NOT_FOUND
          );
      });
      return args.documentId;
    };

    await retryTransaction(rejectDocumentSessionFn, 1, data);

    return AppResponse(req, res, StatusCodes.OK, {
      message: `Document with id ${data.documentId} rejected successfully`,
    });
  }
}

const Documents = new DocumentsController(DocumentsServiceLayer);

export default Documents;
