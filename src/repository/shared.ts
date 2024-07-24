import {
  Model,
  CreateOptions,
  ClientSession,
  PopulateOptions,
  PipelineStage,
  FilterQuery,
  UpdateQuery,
  QueryOptions,
  Types,
} from "mongoose";
import { UpdateManyData } from "../../types/types";

export interface QueryData {
  query: Record<string, unknown>;
  select?: string;
  session?: ClientSession;
  populatedQuery?: PopulateOptions[];
  lean?: boolean;
}
export type QueryId = Omit<QueryData, "query"> & {
  query : Types.ObjectId
}

type commonKeys = Pick<QueryData, "query" | "session">;

export interface PaginationRequestData extends commonKeys {
  aggregatePipeline: PipelineStage.FacetPipelineStage[];
  pagination: {
    pageSize: number;
  }
}

export interface AggregateData {
  pipeline: PipelineStage[],
  session? : ClientSession
}

interface PaginationMeta {
  count: number;
  pages: number;
  cursor: string | undefined;
}

export interface PaginatedResult<T> {
  data: T[] | []
  meta: PaginationMeta | object
}

export interface updateManyQuery<T> {
  filter: Pick<UpdateManyData, "filter">;
  updateData: UpdateQuery<T>;
  options: Omit<QueryOptions<T>, "session">;
}

class DBLayer<T> {
  private model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async createDocs<U extends Partial<T>>(data: U[], session?: ClientSession) {
    const options: CreateOptions = session ? { session } : {};
    const createdDocs = await this.model.create(data, options);

    return createdDocs;
  }

  async findDocs(queryData: QueryData) {
    const { query, select, populatedQuery, session, lean } = queryData;

    if (!populatedQuery && !lean) {
      const data = await this.model.find(query, select, { session });

      return data;
    }

    if (!populatedQuery && lean) {
      const data = await this.model.find(query, select, { session }).lean();
      return data;
    }

    if (populatedQuery && lean) {
      const data = await this.model
        .find(query, select, { session })
        .populate(populatedQuery)
        .lean();

      return data;
    }

    return [];
  }

  async findOneDoc(queryData: QueryData) {
    const { query, select, populatedQuery, session, lean } = queryData;

    if (!populatedQuery && !lean) {
      const data = await this.model.findOne(query, select, { session });

      return data;
    }

    if (!populatedQuery && lean) {
      const data = await this.model.findOne(query, select, { session }).lean();

      return data;
    }

    if (populatedQuery && lean) {
      const data = await this.model
        .findOne(query, select, { session })
        .populate(populatedQuery)
        .lean();

      return data;
    }

    return null;
  }

  async findDocById(queryData: QueryId) {

    const { query, select, populatedQuery, session, lean } = queryData;
      
    console.log(query, "GHU")
  
    if (!populatedQuery && !lean) {
      console.log(queryData, "TYue")
      const data = await this.model.findById(query, select, { session });

      return data;
    }

    if (!populatedQuery && lean) {
  
      const data = await this.model.findById(query, select, { session }).lean();
      return data;
    }

    if (populatedQuery && lean) {
   
      const data = await this.model
        .findById(query, select, { session })
        .populate(populatedQuery)
        .lean();
      return data;
    }

    console.log("DFG")
    return null;
  }

  async aggregateData(request: AggregateData) {

    if(request?.session){

      return this.model.aggregate(request.pipeline).session(request.session)
    }

    const data = await this.model.aggregate(

      request.pipeline
    )
  
    return data

  }

  async paginateData(
    request: PaginationRequestData
  ): Promise<PaginatedResult<T>> {



    const data = await this.model.aggregate([
      {
        $match: request.query,
      },

      {
        $facet: {
          count: [{ $count: "total" }],
          matchedDocuments: request.aggregatePipeline,
        },
      },
      {
        $unwind: "$count",
      },
      {
        $project: {
          _id: 0,
          count: "$count.total",
          data: "$matchedDocuments",
        },
      },
    ]);


    if (!data || data.length === 0) {
      return {
        data: [],
        meta: {},
      };
    }

    const results = data[0]?.data;
    const mainData = results.length > request.pagination.pageSize ? results.slice(0, results.length - 1) : results

    const paginatedResult: PaginatedResult<T> = {
      data: mainData,
      meta: {
        count: data[0]?.count || 0,
        //if the query has up to 101 results, it means there is a new page since we are querying for 100 per batch
        cursor: results.length === 101 && mainData[mainData.length - 1]?._id,
        pages: Math.ceil(data[0].count / request.pagination.pageSize),
      },
    };

    return paginatedResult;
  }

  async updateDoc(request: {
    docToUpdate: object;
    updateData: UpdateQuery<T>;
    options: QueryOptions<T>;
  }) {
    const update = request.updateData;
    const options = request.options;
    const filter: FilterQuery<T> = request.docToUpdate;
    const data = await this.model.findOneAndUpdate(filter, update, options);

    return data;
  }

  async bulkWriteDocs(request: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    operations: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any;
  }) {
    const { operations, options } = request;

    const result = await this.model.bulkWrite(operations, options);

    return result;
  }

  async updateManyDocs(request: updateManyQuery<T>) {
    const updateManyQuery = this.model.updateMany(
      request.filter,
      request.updateData,
      request.options
    );

    const data = await updateManyQuery.lean().exec();

    return data;
  }

  //Use this when you want to perform an aggregation that is not linked to pagination of data
  async aggregateDocs(request: PipelineStage[], session? : ClientSession) {
    const result = await this.model.aggregate(request, {session});
    return result;
  }

  async deleteDocs(request: string[] | FilterQuery<T>) {

    if (Array.isArray(request)) {
      const data = { _id: { $in: request } };

      const result = await this.model.deleteMany(data);

      return result;
    }

    const result = await this.model.deleteMany(request);

    return result;
  }
}
export default DBLayer;
