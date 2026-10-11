import { Agent as HttpAgent, type ClientRequestArgs } from "node:http"
import { Agent as HttpsAgent, type RequestOptions } from "node:https"
import { isIP } from "node:net"
import type { Duplex } from "node:stream"
import {
  isPublicAddress,
  lookupPublicAddress,
  NonPublicAddressError,
} from "./publicAddress.js"

type CreateConnectionCallback = (error: Error | null, stream: Duplex) => void

/** Node does not call `lookup` for a host that is already an address. */
function toRefusedAddressLiteral(host: string | null | undefined) {
  const address = host?.replace(/^\[|\]$/g, "")
  const isNonPublicAddressLiteral =
    !!address && isIP(address) !== 0 && !isPublicAddress(address)

  return isNonPublicAddressLiteral ? address : undefined
}

/** @returns whether the connection was refused, the refusal reported to `callback`. */
function refuseNonPublicAddressLiteral(
  options: Pick<ClientRequestArgs, "host" | "hostname">,
  callback?: CreateConnectionCallback,
) {
  const refusedAddress = toRefusedAddressLiteral(
    options.host ?? options.hostname,
  )

  if (!refusedAddress) return false

  const refusal = new NonPublicAddressError(refusedAddress)

  if (!callback) throw refusal

  // @types/node requires a stream, but Node reports a failed socket creation
  // with the error alone (see `agent.createConnection` in its http docs).
  const reportRefusal = callback as (error: Error) => void

  reportRefusal(refusal)

  return true
}

class PublicAddressHttpAgent extends HttpAgent {
  constructor() {
    super({ lookup: lookupPublicAddress })
  }

  override createConnection(
    options: ClientRequestArgs,
    callback?: CreateConnectionCallback,
  ) {
    const isRefused = refuseNonPublicAddressLiteral(options, callback)

    return isRefused ? undefined : super.createConnection(options, callback)
  }
}

class PublicAddressHttpsAgent extends HttpsAgent {
  constructor({ rejectUnauthorized }: { rejectUnauthorized: boolean }) {
    super({ lookup: lookupPublicAddress, rejectUnauthorized })
  }

  override createConnection(
    options: RequestOptions,
    callback?: CreateConnectionCallback,
  ) {
    const isRefused = refuseNonPublicAddressLiteral(options, callback)

    return isRefused ? undefined : super.createConnection(options, callback)
  }
}

let isPrivateNetworkAllowed = false

/**
 * Whether requests to addresses users entered may reach private networks, from
 * the instance's `allowPrivateNetworkRequests` setting. Until it is applied
 * they may not.
 */
export function setPrivateNetworkRequestsAllowed(allowed: boolean) {
  isPrivateNetworkAllowed = allowed
}

const publicHttpAgent = new PublicAddressHttpAgent()
const publicHttpsAgent = new PublicAddressHttpsAgent({
  rejectUnauthorized: true,
})
const publicSelfSignedHttpsAgent = new PublicAddressHttpsAgent({
  rejectUnauthorized: false,
})
const selfSignedHttpsAgent = new HttpsAgent({ rejectUnauthorized: false })

type UserAddressRequestOptions = {
  httpAgent?: HttpAgent
  httpsAgent?: HttpsAgent
  proxy?: false
}

/**
 * The options for a request to an address a user entered: a data source, a
 * connector, a link. Unless private networks are allowed, every connection
 * the request opens, redirects included, has to reach the public internet. It
 * then bypasses the proxy from `HTTP_PROXY`/`HTTPS_PROXY`, which would reach
 * the address in the agents' place and leave them checking the proxy's.
 */
export function getUserAddressRequestOptions({
  allowSelfSigned = false,
}: {
  allowSelfSigned?: boolean
} = {}): UserAddressRequestOptions {
  if (isPrivateNetworkAllowed) {
    return {
      httpsAgent: allowSelfSigned ? selfSignedHttpsAgent : undefined,
    }
  }

  return {
    httpAgent: publicHttpAgent,
    httpsAgent: allowSelfSigned ? publicSelfSignedHttpsAgent : publicHttpsAgent,
    proxy: false,
  }
}
