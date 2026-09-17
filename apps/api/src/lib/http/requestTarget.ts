import dns from "node:dns"
import { isIP } from "node:net"
import { isPrivateAddress } from "./privateNetwork"

const ALLOWED_PROTOCOLS = ["http:", "https:"]

export class UnsafeRequestTargetError extends Error {
  constructor(reason: string) {
    super(`Refusing to fetch request target: ${reason}`)
  }
}

type SafeTargetOptions = {
  allowPrivateNetwork: boolean
}

const resolveAddresses = async (hostname: string) => {
  if (isIP(hostname)) return [hostname]

  const records = await dns.promises.lookup(hostname, { all: true })

  return records.map((record) => record.address)
}

/**
 * Validates a URL the server is about to fetch on a user's behalf.
 *
 * Resolves the hostname and rejects when any returned address is outside
 * public address space, so a hostname cannot be pointed at the instance's
 * own network. Every address is checked rather than just the first,
 * because a resolver returning one public and one private record would
 * otherwise let the connection land on the private one.
 *
 * This is a pre-flight check only: it cannot see redirects or a second
 * resolution at connect time, so callers fetching with a follow-redirects
 * client must also install {@link createSafeLookup} on their agent.
 */
export const assertSafeRequestTarget = async (
  target: string,
  { allowPrivateNetwork }: SafeTargetOptions,
) => {
  let url: URL

  try {
    url = new URL(target)
  } catch {
    throw new UnsafeRequestTargetError("not a valid absolute url")
  }

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    throw new UnsafeRequestTargetError(`unsupported protocol ${url.protocol}`)
  }

  if (allowPrivateNetwork) return

  const addresses = await resolveAddresses(url.hostname).catch(() => {
    throw new UnsafeRequestTargetError(`cannot resolve ${url.hostname}`)
  })

  if (addresses.length === 0) {
    throw new UnsafeRequestTargetError(`cannot resolve ${url.hostname}`)
  }

  const privateAddress = addresses.find(isPrivateAddress)

  if (privateAddress) {
    throw new UnsafeRequestTargetError(
      `${url.hostname} resolves to the non-public address ${privateAddress}`,
    )
  }
}

/**
 * `dns.lookup` replacement for an http(s) Agent that fails the connection
 * when a hostname resolves into non-public address space. Installing it on
 * the agent is what closes the gaps a pre-flight URL check cannot cover:
 * redirect hops and a resolver that answers differently the second time.
 */
export const createSafeLookup = ({
  allowPrivateNetwork,
}: SafeTargetOptions): typeof dns.lookup => {
  const safeLookup = (
    hostname: string,
    options: unknown,
    callback: (...args: any[]) => void,
  ) => {
    dns.lookup(
      hostname,
      { ...(options as dns.LookupAllOptions), all: true },
      (error, addresses) => {
        if (error) {
          callback(error)
          return
        }

        const rejected = allowPrivateNetwork
          ? undefined
          : addresses.find((record) => isPrivateAddress(record.address))

        if (rejected) {
          callback(
            new UnsafeRequestTargetError(
              `${hostname} resolves to the non-public address ${rejected.address}`,
            ),
          )
          return
        }

        const wantsAll = (options as dns.LookupAllOptions | undefined)?.all

        if (wantsAll) {
          callback(null, addresses)
          return
        }

        const [first] = addresses

        if (!first) {
          callback(new UnsafeRequestTargetError(`cannot resolve ${hostname}`))
          return
        }

        callback(null, first.address, first.family)
      },
    )
  }

  /**
   * Node types `lookup` as the full overloaded `dns.lookup`, which a single
   * implementation signature cannot satisfy; the agent only ever invokes the
   * (hostname, options, callback) form handled above.
   */
  return safeLookup as unknown as typeof dns.lookup
}

/**
 * Instance policy for reaching non-public address space. Off by default so a
 * shared instance cannot be used to probe its own network; self-hosters whose
 * providers live on a LAN or on localhost opt in explicitly.
 */
export const isPrivateNetworkAllowed = () =>
  process.env.DOWNLOAD_ALLOW_PRIVATE_NETWORK === "true"
