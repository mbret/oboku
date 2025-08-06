export enum ObokuErrorCode {
  UNKNOWN = "0",
  BAD_USER_INPUT = "2000",
  ERROR_SIGNIN_NO_EMAIL = "3000",
  ERROR_SIGNIN_EMAIL_NO_VERIFIED = "3001",
  ERROR_DATASOURCE_UNKNOWN = "4000",
  ERROR_DATASOURCE_UNAUTHORIZED = "4001",
  ERROR_DATASOURCE_RATE_LIMIT_EXCEEDED = "4002",
  ERROR_DATASOURCE_NETWORK_UNREACHABLE = "4003",
  ERROR_RESOURCE_NOT_FOUND = "5000",
}

export class ObokuSharedError extends Error {
  constructor(
    public code: ObokuErrorCode,
    public previousError?: unknown,
    public severity: "internal" | "user" = "internal",
  ) {
    super(
      previousError instanceof Error
        ? previousError.message
        : `ObokuSharedError: ${code}`,
    )
  }
}
