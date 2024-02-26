import {
  Document,
  Model,
  CreateOptions,
  ClientSession,
  PopulateOptions,
  PipelineStage,
  FilterQuery,
  UpdateQuery,
  QueryOptions,
} from "mongoose";

export interface QueryData {
  query: Record<string, unknown>;
  select?: string;
  session?: ClientSession;
  populatedQuery?: PopulateOptions;
  lean?: boolean;
}

type commonKeys = Pick<QueryData, "query" | "session">;

export interface PaginationRequestData extends commonKeys {
  aggregatePipeline: PipelineStage.FacetPipelineStage[];
  pagination: {
    page: number;
    pageSize: number;
  };
}

interface PaginationMeta {
  count: number;
  page: number;
  pages: number;
}

export interface PaginatedResult<T> {
  data: T[] | undefined;
  meta: PaginationMeta | undefined;
}

class DBLayer<T extends Document> {
  private model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async createDocs<U extends Partial<T>>(
    data: U[],
    session?: ClientSession
  ): Promise<T[]> {
    const options: CreateOptions = session ? { session } : {};
    const createdDocs = await this.model.create(data, options);

    return createdDocs;
  }

  async findDocs(queryData: QueryData): Promise<T[]> {
    const { query, select, populatedQuery, session, lean } = queryData;

    let data: T[] = [];

    if (!populatedQuery && !lean) {
      data = await this.model.find(query, select, { session });

      return data;
    }

    if (!populatedQuery && lean) {
      data = await this.model.find(query, select, { session }).lean();
    }

    if (populatedQuery && lean) {
      data = await this.model
        .find(query, select, { session })
        .populate(populatedQuery)
        .lean();
    }

    return data;
  }

  async paginateData(
    request: PaginationRequestData
  ): Promise<PaginatedResult<T> | void> {
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
        data: undefined,
        meta: undefined,
      };
    }

    const paginatedResult: PaginatedResult<T> = {
      data: data[0].data,
      meta: {
        count: data[0]?.count || 0,
        page: request.pagination.page,
        pages: Math.ceil(data[0].count / request.pagination.pageSize),
      },
    };

    return paginatedResult;
  }

  async sampleData(
    query: PipelineStage[]
    //   {
    //   match: FilterQuery<T>;
    //   project: Record<string, number>;
    // }
  ): Promise<T[] | void> {
    const dataSample = await this.model.aggregate(query);

    return dataSample;
  }

  async updateDoc(request: {
    docToUpdate: object;
    updateData: UpdateQuery<T>;
    options: QueryOptions<T>;
  }): Promise<null | T> {
    const update = request.updateData;
    const options = request.options;
    const filter: FilterQuery<T> = request.docToUpdate;

    const data = await this.model.findOneAndUpdate(filter, update, options);

    return data;
  }

  // async updateManyDocs(request: {
  //   filter: Pick<UpdateManyData, "filter">;
  //   updateData: UpdateQuery<T>;
  //   options: Omit<QueryOptions<T>, "session">;
  // }) {
  //   const updateManyQuery = this.model.updateMany(
  //     request.filter,
  //     request.updateData,
  //     request.options
  //   );

  //   const data = await updateManyQuery.lean().exec();

  //   return data;
  // }

  // async updateDocs(
  //   request: {
  //     docsToUpdate: Types.ObjectId | Types.ObjectId[];
  //     updateData: UpdateQuery<T>
  //   },
  //   options :
  // ) : Promise<UpdateWriteOpResult>{

  //   const update  = request.updateData

  //   const filter: FilterQuery<T> = {};

  //   if (Array.isArray(request.docsToUpdate)) {
  //     const TypedObjectId = request.docsToUpdate.map(
  //       (docId) => new Types.ObjectId(docId)
  //     );

  //     filter["_id"] = { $in: TypedObjectId };
  //   } else {
  //     filter["_id"] = { $eq: new Types.ObjectId(request.docsToUpdate) };
  //   }

  //   const data = await this.model.updateMany(
  //     filter,
  //     update,
  //     options
  //   );

  //   return data;
  // }

  async aggregateDocs(request: PipelineStage[]) {
    const result = await this.model.aggregate(request);
    return result;
  }
}
export default DBLayer;

//   async findDocs(): Promise<T[] | undefined> {
//     try {
//       const docs = await this.model.find();
//       return docs;
//     } catch (error) {
//       console.error("Error finding documents:", error);
//       return undefined;
//     }
//   }
