import { NextFunction, Request, Response } from "express"
import { StatusCodes, getReasonPhrase } from "http-status-codes"
import AppError from "../errors/BaseError"
import { ROLES, SUBROLES} from "../../config/enums"

export const verifyPermissions = (allowedRoles : number[], allowedSubRoles : number[] = []) => { 
  return (req : Request, res : Response, next : NextFunction ) => { 
     

    if(!req.role || !(allowedRoles.includes(req.role))){ 
        throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)
    }

    if((req.role == ROLES.DRIVER || req.role == ROLES.RIDER) && req.subRole) {
        throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)
    }

      if (allowedSubRoles && req.subRole && !allowedSubRoles.includes(req.subRole) || !(req.subRole in SUBROLES)) {
          throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN);
      }
    
      req.allowedRoles =  allowedRoles
      req.allowedSubRoles =  allowedSubRoles

    next()
  }
    

}