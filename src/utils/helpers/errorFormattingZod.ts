import {z}  from "zod"

// Custom error map function
export const getZodErrors = (errors: z.ZodIssue[]) => {
    const errorMap: Record<string, string> = {};

    errors.forEach((issue) => {
        if(issue?.path.length > 0){
            issue.path.forEach((path) => {

                errorMap[path] = issue.message
            })
        }
    });

    return errorMap;
};

const getErrorMessage = (issue : z.ZodIssueOptionalMessage, ctx)  => {
    switch (issue.code) {
        case z.ZodIssueCode.invalid_type:
            if(issue.expected === "string"){
                return {
                    message: `${issue.path} must be a valid text`
                }
            } else {

            return { message : `${issue.path} must be a valid ${issue.expected}`};

            }
   break

        case z.ZodIssueCode.invalid_literal:
            return {message : `Invalid value, expected '${issue.expected}'`}
            break

        case z.ZodIssueCode.custom:
            return {
                message: issue.message};
            break;
        case z.ZodIssueCode.invalid_union:
            return {
                message: 'Invalid union type' };
                 break;
        case z.ZodIssueCode.invalid_enum_value:
            return {
                message: `Invalid enum value. Expected ${issue.options.join(', ')}`};
                 break;
        case z.ZodIssueCode.invalid_arguments:
            return {
                message: 'Invalid function arguments' };
                 break;
        case z.ZodIssueCode.invalid_return_type:
            return {
                message: 'Invalid return type' } ;
                 break;
        case z.ZodIssueCode.invalid_date:
            return {
                message: 'Invalid date'};
                 break;
        case z.ZodIssueCode.invalid_string:
            return {
                message:  'Invalid string'}
        case z.ZodIssueCode.too_small:
            return {
                message: issue.message}
                 break;
        case z.ZodIssueCode.too_big:
            return {
                message:  issue.message}
                 break;
        case z.ZodIssueCode.invalid_intersection_types:
            return {message : 'Invalid intersection types'}
        case z.ZodIssueCode.not_multiple_of:
            return {
                message: `Number must be a multiple of ${issue.multipleOf}` };
                 break;
        default:
            return { message: ctx.defaultError };
    }
};

z.setErrorMap(getErrorMessage)