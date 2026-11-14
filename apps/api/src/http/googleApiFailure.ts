import { isRecord } from "./isRecord.js"

/**
 * The answer a failed Google API request got, as gaxios attaches it to its
 * error: its status, and its body when gaxios parsed one, which it never
 * does for a streamed answer. Read it rather than keep the error, whose
 * config carries the request's credentials.
 */
export const toGoogleApiFailure = (error: unknown) => {
  const response = isRecord(error) ? error.response : undefined

  return {
    status:
      isRecord(response) && typeof response.status === "number"
        ? response.status
        : undefined,
    body: isRecord(response) ? response.data : undefined,
  }
}
