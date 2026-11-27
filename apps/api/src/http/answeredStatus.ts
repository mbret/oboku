import { isRecord } from "./isRecord.js"

/** The status a server answered with, when the request's error carries it. */
export const toAnsweredStatus = (error: unknown) =>
  isRecord(error) && typeof error.status === "number" ? error.status : null

const UNAUTHORIZED_STATUSES = [401, 403]

/** Whether the server refused the connector's username and password. */
export const isSignInRefused = (error: unknown) => {
  const answeredStatus = toAnsweredStatus(error)

  return (
    answeredStatus !== null && UNAUTHORIZED_STATUSES.includes(answeredStatus)
  )
}

/**
 * Whether the server refused the password itself (401). Unlike
 * `isSignInRefused`, a 403 does not count: once a connector signed in, a 403
 * on one file refuses that file, not the password.
 */
export const isPasswordRefused = (error: unknown) =>
  toAnsweredStatus(error) === 401
