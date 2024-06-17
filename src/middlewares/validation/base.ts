// validateMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import AppError from '../errors/BaseError';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

const validateRequest = <T>(schema: ZodSchema<T>) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse(req.body ?? req.query ?? req.params);
        next();
    } catch (error : unknown ) {
        throw new AppError(getReasonPhrase(StatusCodes.BAD_REQUEST), StatusCodes.BAD_REQUEST, "", (error as ZodError).errors)
   
    }
};

export default validateRequest;
