type DriveResponseError = {
  body?: string
  headers?: {}
  result?: {
    error?: {
      code?: number
      message?: string
      errors?: []
    }
  }
  status?: number
  statusText?: string | null
}

export const isDriveResponseError = (
  error: any
): error is DriveResponseError => {
  return typeof error === "object" && `body` in error && `result` in error
}
