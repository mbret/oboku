export const ERROR_EMAIL_TAKEN = '1000'
export const BAD_USER_INPUT = '2000'
export const ERROR_INVALID_BETA_CODE = '3000'
export const ERROR_DATASOURCE_UNKNOWN = '4000'
export const ERROR_DATASOURCE_UNAUTHORIZED = '4001'

export type ERROR =
  | typeof ERROR_EMAIL_TAKEN
  | typeof BAD_USER_INPUT
  | typeof ERROR_INVALID_BETA_CODE
  | typeof ERROR_DATASOURCE_UNKNOWN
  | typeof ERROR_DATASOURCE_UNAUTHORIZED

export class ObokuSharedError extends Error {
  constructor(public code: ERROR, public previousError?: Error) {
    super()
  }
}