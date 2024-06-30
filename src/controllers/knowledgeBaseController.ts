import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import KnowledgeBaseService, {
    KnowledgeBaseServiceLayer,
} from "../services/knowledgeBaseService";
import { Request, Response } from "express";
import { IKnowledgeBase } from "../model/interfaces";
import AppResponse from "../utils/helpers/AppResponse";
import { MatchQuery, SortQuery } from "../../types/types";
import { sortRequest } from "../utils/helpers/sortQuery";
import { Types } from "mongoose";


class KnowledgeBaseController {
    private knowledgeBase: KnowledgeBaseService;

    constructor(service: KnowledgeBaseService) {
        this.knowledgeBase = service;
    }

    async createKnowledgeBase(req: Request, res: Response) {
        const data: IKnowledgeBase = req.body;

        const createdKnowledgeBase = await this.knowledgeBase.createKnowledgeBase(data)

        return AppResponse(req, res, StatusCodes.CREATED, {
            message: "knowledgeBase created successfully",
            data: createdKnowledgeBase,
        });
    }

    async getKnowledgeBase(req: Request, res: Response) {
        const data: {
            knowledgeBaseId?: string;
            parentKnowledgeBaseId?: string,
            subKnowledgeBaseId? : string,
            cursor?: string;
            sort?: string;
        } = req.body;

        const matchQuery: MatchQuery = {};

        if (data?.knowledgeBaseId) {
            matchQuery._id = { $eq: data.knowledgeBaseId };
        }

    

        if (data?.parentKnowledgeBaseId) {
            matchQuery.parentId = { $eq: new Types.ObjectId(data.parentKnowledgeBaseId) };
        }

        if (data?.subKnowledgeBaseId) {
            matchQuery.subKnowledgeBase = { $eq: new Types.ObjectId(data.subKnowledgeBaseId) };
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
            aggregatePipeline: [
                { $limit: 101 },

                sortQuery],
            pagination: { pageSize: 100 },
        };

        const result = await this.knowledgeBase.findKnowledgeBases(query);

        const hasData = result?.data?.length && result?.data?.length > 0;

        return AppResponse(
            req,
            res,
            hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            {
                message: hasData
                    ? `Knowledge base  retrieved succesfully`
                    : `No knowledgebases  were found for this request `,
                data: result,
            }
        );
    }

    async getKnowledgeBaseById(req: Request, res: Response) {
        const stationId: string = req.params.id;

        const result = await this.knowledgeBase.getKnowledgeBaseById(stationId);

        if (!result)
            throw new AppError(
                "No knowledge base was found for this request",
                StatusCodes.NOT_FOUND
            );

        return AppResponse(req, res, StatusCodes.OK, {
            message: "Knowledge base retrieved successfully",
            data: result,
        });
    }

    async updateKnowledgeBase(req: Request, res: Response) {
        const data: IKnowledgeBase & { knowledgeBaseId: string } = req.body;


        const { knowledgeBaseId, ...rest } = data;


        const updatedKnowledgeBase = await this.knowledgeBase.updateKnowledgeBase({
            docToUpdate: {_id : new Types.ObjectId(knowledgeBaseId)} ,
            updateData: {
                $set: {
                    ...rest,
                },
            },
            options: {
                new: true,
                select: "_id ",
            },
        });

        if (!updatedKnowledgeBase)
            throw new AppError(
                "Error : Knowledge base update  failed",
                StatusCodes.NOT_FOUND
            );



        return AppResponse(req, res, StatusCodes.OK, {
            message: "Knowledge Base KnowledgeBase updated successfully",
            data: updatedKnowledgeBase,
        });
    }

    //Admins only
    async deleteKnowledgeBase(req: Request, res: Response) {
        const data: { knowledgeBaseIds: string[] } = req.body;

        const { knowledgeBaseIds } = data;

        if (knowledgeBaseIds.length === 0)
            throw new AppError(
                getReasonPhrase(StatusCodes.BAD_REQUEST),
                StatusCodes.BAD_REQUEST
            );

        const deletedKnowledgeBases = await this.knowledgeBase.deleteKnowledgeBases(
            knowledgeBaseIds
        )

        return AppResponse(req, res, StatusCodes.OK, {
            message: `${deletedKnowledgeBases.deletedCount} knowledge bases deleted.`,
        });
    }


}

export const KnowledgeBase = new KnowledgeBaseController(KnowledgeBaseServiceLayer);

export default KnowledgeBase;
