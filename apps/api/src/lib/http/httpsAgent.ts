import { Agent as HttpAgent } from "node:http"
import { Agent as HttpsAgent } from "node:https"
import { createSafeLookup } from "./requestTarget"

export const getHttpsAgent = (allowSelfSigned?: boolean) => {
  if (!allowSelfSigned) {
    return undefined
  }

  return new HttpsAgent({
    rejectUnauthorized: false,
  })
}

/**
 * Agents for fetching a target supplied by the user (a URI link, a WebDAV
 * connector). Unlike {@link getHttpsAgent} these are always created, because
 * the guarded lookup they carry is what enforces the private-network policy
 * on redirect hops and on re-resolution at connect time.
 */
export const createGuardedAgents = ({
  allowSelfSigned,
  allowPrivateNetwork,
}: {
  allowSelfSigned?: boolean
  allowPrivateNetwork: boolean
}) => {
  const lookup = createSafeLookup({ allowPrivateNetwork })

  return {
    httpAgent: new HttpAgent({ lookup }),
    httpsAgent: new HttpsAgent({
      lookup,
      rejectUnauthorized: !allowSelfSigned,
    }),
  }
}
