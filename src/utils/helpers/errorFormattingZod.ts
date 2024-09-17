import { z, ZodError } from "zod"

// Custom error map function
// export const getZodErrors = (errors: z.ZodIssue[]) => {
//     const errorMap: Record<string, string> = {};

//     errors.forEach((issue) => {
//         if (issue?.path.length > 0) {
//             issue.path.forEach((path) => {

//                 errorMap[path] = issue.message
//             })
//         }
//     });

//     return errorMap;
// };

// const getErrorMessage = (issue: z.ZodIssueOptionalMessage, ctx) => {

//     switch (issue.code) {
//         case z.ZodIssueCode.invalid_type:
//             if (issue.expected === "string") {
//                 return {
//                     message: `${issue.path} must be a valid text`
//                 }
//             } else {

//                 return { message: `${issue.path} must be a valid ${issue.expected}` };

//             }
//             break

//         case z.ZodIssueCode.invalid_literal:
//             return { message: `Invalid value, expected '${issue.expected}'` }
//             break

//         case z.ZodIssueCode.custom:
//             return {
//                 message: issue.message
//             };
//             break;
//         case z.ZodIssueCode.invalid_union:
//             return {
//                 message: 'Invalid union type'
//             };
//             break;
//         case z.ZodIssueCode.invalid_enum_value:
//             return {
//                 message: `Invalid enum value. Expected ${issue.options.join(', ')}`
//             };
//             break;
//         case z.ZodIssueCode.invalid_arguments:
//             return {
//                 message: 'Invalid function arguments'
//             };
//             break;
//         case z.ZodIssueCode.invalid_return_type:
//             return {
//                 message: 'Invalid return type'
//             };
//             break;
//         case z.ZodIssueCode.invalid_date:
//             return {
//                 message: 'Invalid date'
//             };
//             break;
//         case z.ZodIssueCode.invalid_string:
//             return {
//                 message: 'Invalid string'
//             }
//         case z.ZodIssueCode.too_small:
//             return {
//                 message: issue.message
//             }
//             break;
//         case z.ZodIssueCode.too_big:
//             return {
//                 message: issue.message
//             }
//             break;
//         case z.ZodIssueCode.invalid_intersection_types:
//             return { message: 'Invalid intersection types' }
//         case z.ZodIssueCode.not_multiple_of:
//             return {
//                 message: `Number must be a multiple of ${issue.multipleOf}`
//             };
//             break;
//         default:
//             return { message: ctx.defaultError };
//     }
// };

// z.setErrorMap(getErrorMessage)


export function parseZodErrors(error: ZodError): Record<string, string> {

    const errorObject: Record<string, string> = {};

    error.errors.forEach((err) => {
        const key = err.path.join('.');
        let message = '';

        switch (err.code) {
            case 'invalid_type':
                if (err.expected === 'string') {
                    message = `${key} can only contain text.`;
                } else if (err.expected === 'number') {
                    message = `${key} must be a number.`;
                } else if (err.expected === 'date') {
                    message = `${key} must be a valid date.`;
                } else {
                    message = `${key} must be a ${err.expected}.`;
                }
                break;
            case 'invalid_string':
                if (err.validation === 'email') {
                    message = `${key} must be a valid email address.`;
                } else if (err.validation === 'url') {
                    message = `${key} must be a valid URL.`;
                } else if (err.validation === 'uuid') {
                    message = `${key} must be a valid UUID.`;
                } else {
                    message = `${key} is not valid. ${err.message}`;
                }
                break;
            case 'too_small':
                if (err.type === 'string') {
                    message = `${key} must be at least ${err.minimum} characters long.`;
                } else if (err.type === 'number') {
                    message = `${key} must be ${err.inclusive ? 'at least' : 'greater than'} ${err.minimum}.`;
                } else {
                    message = `${key} must have at least ${err.minimum} items.`;
                }
                break;
            case 'too_big':
                if (err.type === 'string') {
                    message = `${key} must not exceed ${err.maximum} characters.`;
                } else if (err.type === 'number') {
                    message = `${key} must be ${err.inclusive ? 'at most' : 'less than'} ${err.maximum}.`;
                } else {
                    message = `${key} must not have more than ${err.maximum} items.`;
                }

                break;
            case 'invalid_enum_value':
                message = `${key} must be one of the following values: ${err.options.join(', ')}.`;
                break;
            case 'invalid_date':
                message = `${key} must be a valid date.`;
                break;
            default:
                message = `${key}: ${err.message}`;
        }

        errorObject[key] = message;
    });

    return errorObject;
}