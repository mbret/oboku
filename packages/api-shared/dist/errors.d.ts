import { Errors } from '@oboku/shared/src';
export declare class ServerError extends Error {
    previousError?: any;
    constructor(previousError?: any);
}
export declare class BadRequestError extends Error {
    errors: {
        code: typeof Errors[keyof typeof Errors];
    }[];
    constructor(errors?: {
        code: typeof Errors[keyof typeof Errors];
    }[]);
}
export declare class NotFoundError extends Error {
    errors: {
        code: typeof Errors[keyof typeof Errors];
    }[];
    constructor(errors?: {
        code: typeof Errors[keyof typeof Errors];
    }[]);
}
export declare class UnauthorizedError extends Error {
    errors: {
        code: typeof Errors[keyof typeof Errors];
    }[];
    constructor(errors?: {
        code: typeof Errors[keyof typeof Errors];
    }[]);
}
