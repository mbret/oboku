import dns from "node:dns"
import { isPrivateAddress } from "./privateNetwork"

export class UnsafeRequestTargetError extends Error {
  constructor(reason: string) {
    super(`Refusing to fetch request target: ${reason}`)
  }
}

/**
 * Instance policy for reaching non-public address space. Off by default so a
 * shared instance cannot be used to probe its own network; self-hosters whose
 * providers live on a LAN or on localhost opt in explicitly.
 */
export const isPrivateNetworkAllowed = () =>
  process.env.DOWNLOAD_ALLOW_PRIVATE_NETWORK === "true"

/**
 * `dns.lookup` replacement for an http(s) Agent that fails the connection when
 * a hostname resolves into non-public address space.
 *
 * The check belongs on the agent rather than on a url inspected beforehand,
 * because this is the only point that sees the address actually being dialled:
 * it covers redirect hops, a resolver that answers differently the second
 * time, and providers that build their url inside a client library. Every
 * returned record is checked, so a resolver answering with one public and one
 * private address cannot land the connection on the private one.
 */
export const createSafeLookup = ({
  allowPrivateNetwork,
}: {
  allowPrivateNetwork: boolean
}): typeof dns.lookup => {
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
