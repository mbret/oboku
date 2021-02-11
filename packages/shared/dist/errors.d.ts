export declare const ERROR_EMAIL_TAKEN = "1000";
export declare const BAD_USER_INPUT = "2000";
export declare const ERROR_INVALID_BETA_CODE = "3000";
export declare const ERROR_DATASOURCE_UNKNOWN = "4000";
export declare const ERROR_DATASOURCE_UNAUTHORIZED = "4001";
export declare type ERROR = typeof ERROR_EMAIL_TAKEN | typeof BAD_USER_INPUT | typeof ERROR_INVALID_BETA_CODE | typeof ERROR_DATASOURCE_UNKNOWN | typeof ERROR_DATASOURCE_UNAUTHORIZED;
export declare class ObokuSharedError extends Error {
    code: ERROR;
    previousError?: Error;
    constructor(code: ERROR, previousError?: Error);
}
