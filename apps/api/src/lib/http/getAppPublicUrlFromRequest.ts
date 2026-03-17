import type { Request } from "express"

export const getAppPublicUrlFromRequest = (request: Request) => {
  const origin = request.headers.origin

  if (typeof origin === "string" && origin.length > 0) {
    return origin
  }

  const forwardedProto = request.headers["x-forwarded-proto"]
  const forwardedHost = request.headers["x-forwarded-host"]

  const proto =
    typeof forwardedProto === "string" && forwardedProto.length > 0
      ? forwardedProto.split(",")[0]?.trim()
      : request.protocol
  const host =
    typeof forwardedHost === "string" && forwardedHost.length > 0
      ? forwardedHost.split(",")[0]?.trim()
      : request.get("host")

  if (!proto || !host) return undefined

  return `${proto}://${host}`
}
