export enum ObokuErrorCode {
  UNKNOWN = "0",
  BAD_USER_INPUT = "2000",
  ERROR_SIGNIN_NO_EMAIL = "3000",
  ERROR_SIGNIN_EMAIL_NO_VERIFIED = "3001",
  ERROR_SIGNUP_LINK_INVALID = "3002",
  ERROR_SIGNUP_LINK_MISSING_TOKEN = "3003",
  ERROR_ACCOUNT_ALREADY_EXISTS = "3004",
  ERROR_MAGIC_LINK_INVALID = "3005",
  ERROR_MAGIC_LINK_MISSING_TOKEN = "3006",
  ERROR_DATASOURCE_UNKNOWN = "4000",
  ERROR_DATASOURCE_UNAUTHORIZED = "4001",
  ERROR_DATASOURCE_RATE_LIMIT_EXCEEDED = "4002",
  ERROR_DATASOURCE_NETWORK_UNREACHABLE = "4003",
  ERROR_DATASOURCE_DOWNLOAD_DIFFERENT_DEVICE = "4004",
  ERROR_RESOURCE_NOT_FOUND = "5000",
  ERROR_LINK_INVALID = "6000",
  ERROR_NO_LINK = "6001",
  ERROR_RESOURCE_NOT_REACHABLE = "6002",
  ERROR_CONNECTOR_NOT_CONFIGURED = "7000",
}

export type ObokuErrorSeverity = "internal" | "user"

const errorCodeSeverity: Record<ObokuErrorCode, ObokuErrorSeverity> = {
  [ObokuErrorCode.UNKNOWN]: "internal",
  [ObokuErrorCode.BAD_USER_INPUT]: "internal",
  [ObokuErrorCode.ERROR_SIGNIN_NO_EMAIL]: "internal",
  [ObokuErrorCode.ERROR_SIGNIN_EMAIL_NO_VERIFIED]: "internal",
  [ObokuErrorCode.ERROR_SIGNUP_LINK_INVALID]: "user",
  [ObokuErrorCode.ERROR_SIGNUP_LINK_MISSING_TOKEN]: "user",
  [ObokuErrorCode.ERROR_ACCOUNT_ALREADY_EXISTS]: "user",
  [ObokuErrorCode.ERROR_MAGIC_LINK_INVALID]: "user",
  [ObokuErrorCode.ERROR_MAGIC_LINK_MISSING_TOKEN]: "user",
  [ObokuErrorCode.ERROR_DATASOURCE_UNKNOWN]: "internal",
  [ObokuErrorCode.ERROR_DATASOURCE_UNAUTHORIZED]: "internal",
  [ObokuErrorCode.ERROR_DATASOURCE_RATE_LIMIT_EXCEEDED]: "internal",
  [ObokuErrorCode.ERROR_DATASOURCE_NETWORK_UNREACHABLE]: "internal",
  [ObokuErrorCode.ERROR_DATASOURCE_DOWNLOAD_DIFFERENT_DEVICE]: "user",
  [ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND]: "user",
  [ObokuErrorCode.ERROR_LINK_INVALID]: "user",
  [ObokuErrorCode.ERROR_NO_LINK]: "user",
  [ObokuErrorCode.ERROR_RESOURCE_NOT_REACHABLE]: "user",
  [ObokuErrorCode.ERROR_CONNECTOR_NOT_CONFIGURED]: "user",
}

export class ObokuSharedError extends Error {
  public severity: ObokuErrorSeverity

  constructor(
    public code: ObokuErrorCode,
    public previousError?: unknown,
    severity?: ObokuErrorSeverity,
  ) {
    super(
      previousError instanceof Error
        ? previousError.message
        : `ObokuSharedError: ${code}`,
    )

    this.severity = severity ?? errorCodeSeverity[code]

    Object.setPrototypeOf(this, ObokuSharedError.prototype)
  }
}
