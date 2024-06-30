import { Request } from "express"

export const isNotAuthorizedToPerformAction = (req: Request): boolean => {
  
    const result =
        !req.allowedRoles.includes(req.role) ||
        (req.allowedSubRoles.length > 0 &&
            req.subRole &&
            !req?.allowedSubRoles?.includes(req.subRole));

    return result;
};