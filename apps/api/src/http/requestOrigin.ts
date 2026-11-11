import type { Request } from "express"
import { getOutermostForwardedValue } from "./forwardedHeader.js"

/** The origin a client reached the API at, through any proxy in front of it. */
export const getRequestOrigin = (request: Request) => {
  const protocol =
    getOutermostForwardedValue(request.headers["x-forwarded-proto"]) ??
    request.protocol
  const host =
    getOutermostForwardedValue(request.headers["x-forwarded-host"]) ??
    request.host

  return `${protocol}://${host}`
}
