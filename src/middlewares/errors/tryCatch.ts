import { Response, Request, NextFunction, RequestHandler } from "express";

type AsyncControllerMethod<T = void> = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<T | void>;

export const tryCatch = (basefn: AsyncControllerMethod): RequestHandler => {
  return async (req, res, next) => {
    try {
      await basefn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
