import type { Request } from "express"
import { getForwardedProto } from "./forwardedProto.js"

/** The origin a client reached the API at, through any proxy in front of it. */
export const getRequestOrigin = (request: Request) => {
  const protocol =
    getForwardedProto(request.headers["x-forwarded-proto"]) ?? request.protocol

  return `${protocol}://${request.host}`
}
