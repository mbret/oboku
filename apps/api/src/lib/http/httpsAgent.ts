import { Agent as HttpsAgent } from "node:https"

export const getHttpsAgent = (allowSelfSigned?: boolean) => {
  if (!allowSelfSigned) {
    return undefined
  }

  return new HttpsAgent({
    rejectUnauthorized: false,
  })
}
