import { type LookupAddress, lookup as dnsLookup } from "node:dns"
import { BlockList, isIP, type LookupFunction } from "node:net"

/**
 * Networks that do not lead to the public internet (RFC 6890): this host,
 * loopback, private and link-local networks (cloud metadata services
 * included), carrier-grade NAT, documentation, benchmarking, multicast and
 * reserved ranges. An IPv4 entry also matches the IPv4-mapped IPv6 form of its
 * addresses.
 */
const NON_PUBLIC_SUBNETS = [
  { network: "0.0.0.0", prefix: 8, type: "ipv4" },
  { network: "10.0.0.0", prefix: 8, type: "ipv4" },
  { network: "100.64.0.0", prefix: 10, type: "ipv4" },
  { network: "127.0.0.0", prefix: 8, type: "ipv4" },
  { network: "169.254.0.0", prefix: 16, type: "ipv4" },
  { network: "172.16.0.0", prefix: 12, type: "ipv4" },
  { network: "192.0.0.0", prefix: 24, type: "ipv4" },
  { network: "192.0.2.0", prefix: 24, type: "ipv4" },
  { network: "192.88.99.0", prefix: 24, type: "ipv4" },
  { network: "192.168.0.0", prefix: 16, type: "ipv4" },
  { network: "198.18.0.0", prefix: 15, type: "ipv4" },
  { network: "198.51.100.0", prefix: 24, type: "ipv4" },
  { network: "203.0.113.0", prefix: 24, type: "ipv4" },
  { network: "224.0.0.0", prefix: 4, type: "ipv4" },
  { network: "240.0.0.0", prefix: 4, type: "ipv4" },
  { network: "::", prefix: 96, type: "ipv6" },
  { network: "100::", prefix: 64, type: "ipv6" },
  { network: "2001:db8::", prefix: 32, type: "ipv6" },
  { network: "fc00::", prefix: 7, type: "ipv6" },
  { network: "fe80::", prefix: 10, type: "ipv6" },
  { network: "ff00::", prefix: 8, type: "ipv6" },
] as const

const nonPublicNetworks = new BlockList()

for (const { network, prefix, type } of NON_PUBLIC_SUBNETS) {
  nonPublicNetworks.addSubnet(network, prefix, type)
}

export function isPublicAddress(address: string) {
  const family = isIP(address)

  if (family === 0) return false

  return !nonPublicNetworks.check(address, family === 4 ? "ipv4" : "ipv6")
}

function isPublicLookupAddress({ address }: LookupAddress) {
  return isPublicAddress(address)
}

export class NonPublicAddressError extends Error {
  constructor(public readonly host: string) {
    super(`${host} does not resolve to a public address only`)
    this.name = "NonPublicAddressError"
  }
}

/**
 * A `lookup` for outbound requests that refuses a host when any address it
 * resolves to is not public. The connection then uses an address this checked,
 * so a DNS answer that changes between the check and the connection cannot
 * lead it elsewhere.
 */
export const lookupPublicAddress: LookupFunction = function lookupPublicAddress(
  hostname,
  options,
  callback,
) {
  dnsLookup(
    hostname,
    { family: options.family, hints: options.hints, all: true },
    function onResolved(error, addresses: LookupAddress[]) {
      if (error) return callback(error, "")

      const [firstAddress] = addresses

      if (!firstAddress || !addresses.every(isPublicLookupAddress)) {
        return callback(new NonPublicAddressError(hostname), "")
      }

      if (options.all) return callback(null, addresses)

      callback(null, firstAddress.address, firstAddress.family)
    },
  )
}
