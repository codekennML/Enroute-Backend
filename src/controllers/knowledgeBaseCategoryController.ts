import { StatusCodes, getReasonPhrase } from "http-status-codes";
import AppError from "../middlewares/errors/BaseError";
import KnowledgeBaseCategoryService, {
    KnowledgeBaseCategoryServiceLayer,
} from "../services/knowledgeBaseCategoryService";
import { Request, Response } from "express";
import {  IKnowledgeBaseCategory } from "../model/interfaces";
import AppResponse from "../utils/helpers/AppResponse";
import { MatchQuery, SortQuery } from "../../types/types";
import { sortRequest } from "../utils/helpers/sortQuery";
import { Types } from "mongoose";


class KnowledgeBaseCategoryController {
    private knowledgeBaseCategory: KnowledgeBaseCategoryService;

    constructor(service: KnowledgeBaseCategoryService) {
        this.knowledgeBaseCategory = service;
    }

    async createKnowledgeBaseCategory(req: Request, res: Response) {
        const data: IKnowledgeBaseCategory = req.body;

        const createdKnowledgeBaseCategory = await this.knowledgeBaseCategory.createKnowledgeBaseCategory(data)

        return AppResponse(req, res, StatusCodes.CREATED, {
            message: "category created successfully",
            data: createdKnowledgeBaseCategory,
        });
    }

    async getKnowledgeBaseCategories(req: Request, res: Response) {
        const data: {
            categoryId?: string;
            parentId? : string,
            isParent? : boolean
            cursor: string;
           
            sort?: string;
        } = req.body;

        const matchQuery: MatchQuery = {};

        if (data?.categoryId) {
            matchQuery._id = { $eq: data?.categoryId };
        }

        if(data?.isParent){ 
            matchQuery.isParent =  { $eq :data.isParent}
        }

        if(data?.parentId){ 
            matchQuery.parentId = { $eq: new Types.ObjectId(data.parentId) };
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

        const result = await this.knowledgeBaseCategory.findKnowledgeBaseCategories(query);

        const hasData = result?.data?.length === 0;

        return AppResponse(
            req,
            res,
            hasData ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            {
                message: hasData
                    ? `Categories retrieved succesfully`
                    : `No categories were found for this request `,
                data: result,
            }
        );
    }

    async getCategoryById(req: Request, res: Response) {
        const stationId: string = req.params.id;

        const result = await this.knowledgeBaseCategory.getKnowledgeBaseCategoryById (stationId);

        if (!result)
            throw new AppError(
                "No category was found for this request",
                StatusCodes.NOT_FOUND
            );

        return AppResponse(req, res, StatusCodes.OK, {
            message: "Bus station retrieved successfully",
            data: result,
        });
    }

    async updateKnowledgeBaseCategory(req: Request, res: Response) {
        const data: IKnowledgeBaseCategory & { categoryId: string } = req.body;


        const { categoryId, ...rest } = data;



        const updatedCategory = await this.knowledgeBaseCategory.updateKnowledgeBaseCategory ({
            docToUpdate: categoryId,
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

        if (!updatedCategory)
            throw new AppError(
                "Error : Update to bus station failed",
                StatusCodes.NOT_FOUND
            );



        return AppResponse(req, res, StatusCodes.OK, {
            message: "Knowledge Base Category updated successfully",
            data: updatedCategory,
        });
    }

    //Admins only
    async deleteCategory(req: Request, res: Response) {
        const data: { knowledgeBaseCategoryIds: string[] } = req.body;

        const { knowledgeBaseCategoryIds } = data;

        if (knowledgeBaseCategoryIds.length === 0)
            throw new AppError(
                getReasonPhrase(StatusCodes.BAD_REQUEST),
                StatusCodes.BAD_REQUEST
            );

        const deletedBusStations = await this.knowledgeBaseCategory.deleteKnowledgeBaseCategories (
            knowledgeBaseCategoryIds
        )

        return AppResponse(req, res, StatusCodes.OK, {
            message: `${deletedBusStations.deletedCount} bus stations deleted.`,
        });
    }


}

export const KnowledgeBaseCategory = new KnowledgeBaseCategoryController(KnowledgeBaseCategoryServiceLayer);

export default KnowledgeBaseCategory;
