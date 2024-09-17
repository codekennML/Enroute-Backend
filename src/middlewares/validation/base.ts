// validateMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import AppError from '../errors/BaseError';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { parseZodErrors } from '../../utils/helpers/errorFormattingZod';



const validateRequest = <T>(schema: ZodSchema<T>) => (req: Request, res: Response, next: NextFunction) => {
    try {

        let request: object = {}; // Initialize request as an empty object

        const queries = [req.params, req.body, req.query];
        console.log(queries)
        // Filter to find the first non-empty object in queries
        const data = queries.find(info => Object.keys(info).length > 0);

        if (data) {
            // Merge properties of `data` into `request`
            request = { ...request, ...data };
        }

        // Log the merged request object

        // Assuming `schema` is defined somewhere and expects `request` as an object
        schema.parse(request);
        next();

    } catch (error: unknown) {

        const errorMap = parseZodErrors((error as ZodError))

        throw new AppError(getReasonPhrase(StatusCodes.BAD_REQUEST), StatusCodes.BAD_REQUEST, "", errorMap)

    }
};

// export const validateFile = <T>(schema: ZodSchema<T>) => (req: Request, res: Response, next: NextFunction) => {
//     try {
//         schema.parse(req.file)
//         next();
//     } catch (error: unknown) {
//         throw new AppError(getReasonPhrase(StatusCodes.BAD_REQUEST), StatusCodes.BAD_REQUEST, "", (error as ZodError).errors)

//     }
// };

export default validateRequest;
