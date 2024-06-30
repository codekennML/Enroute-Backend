import { NextFunction, Request, Response } from "express"
import { StatusCodes, getReasonPhrase } from "http-status-codes"
import AppError from "../errors/BaseError"
import { ROLES, SUBROLES} from "../../config/enums"

export const verifyPermissions = (allowedRoles: number[], allowedSubRoles: number[] = []) => {

  return (req: Request, res: Response, next: NextFunction) => {

console.log(req.role, allowedRoles)
      if (!req.role || !allowedRoles.includes(req.role)) {
          throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN);
      }

      if ((req.role === ROLES.DRIVER || req.role === ROLES.RIDER) && req.subRole) {
        //IF this is a driver r=or roder and has a subRole
          throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN);
      }


      if (allowedSubRoles && req.subRole && (!allowedSubRoles.includes(req.subRole) || !(req.subRole in SUBROLES))) {
          throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN);
      }

      req.allowedRoles = allowedRoles;
      req.allowedSubRoles = allowedSubRoles;

      next();
  };
};


// export const verifyPermissions = (allowedRoles:number[],allowedSubRoles? : number[]  ) => { 



//          console.log(allowedRoles, allowedSubRoles, "UEFI")
//   return (req : Request, res : Response, next : NextFunction ) => { 
     

//     if(!req.role || !(allowedRoles.includes(req.role))){ 
//         throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)
//     }

//     if((req.role == ROLES.DRIVER || req.role == ROLES.RIDER) && req.subRole) {
//         throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN)
//     }
//     console.log("Maui", allowedRoles, allowedSubRoles)
// console.log("lol", allowedRoles, allowedSubRoles, req.subRole,)

//       if (allowedSubRoles && req.subRole && !allowedSubRoles.includes(req.subRole) || !(req.subRole in SUBROLES)) {
//           throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN);
//       }
    
//       req.allowedRoles =  allowedRoles
//       req.allowedSubRoles =  allowedSubRoles

//     next()
//   }
    

// }

// export const verifyPermisisions = (allowedRoles: number[], allowedSubRoles?: number[]) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     // Check if the user has a valid role
//     if (!req.role || !allowedRoles.includes(req.role)) {
//       throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN);
//     }

//     // Check if the user has a valid sub-role (if applicable)
//     if (req.subRole && allowedSubRoles) {
//       if (!allowedSubRoles.includes(req.subRole)) {
//         throw new AppError(getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN);
//       }
//     } else if (req.subRole && !allowedSubRoles) {
//       // If allowedSubRoles is empty, don't throw an error
//       // if the user has a sub-role
//       req.subRole = null;
//     }

//     // Store the allowed roles and sub-roles in the request object
//     req.allowedRoles = allowedRoles;
//     req.allowedSubRoles = allowedSubRoles;

//     next();
//   };
// };