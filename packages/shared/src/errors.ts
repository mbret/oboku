export enum ObokuErrorCode {
  UNKNOWN = "0",
  ERROR_EMAIL_TAKEN = "1000",
  BAD_USER_INPUT = "2000",
  ERROR_INVALID_BETA_CODE = "3000",
  ERROR_DATASOURCE_UNKNOWN = "4000",
  ERROR_DATASOURCE_UNAUTHORIZED = "4001",
  ERROR_DATASOURCE_RATE_LIMIT_EXCEEDED = "4002",
  ERROR_DATASOURCE_NETWORK_UNREACHABLE = "4003"
}

export class ObokuSharedError extends Error {
  constructor(public code: ObokuErrorCode, public previousError?: Error) {
    super(previousError?.message || "")
  }
}
