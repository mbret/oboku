import { type LookupAddress, lookup as dnsLookup } from "node:dns"
import { BlockList, isIP, type LookupFunction } from "node:net"

/**
 * Networks that do not lead to the public internet, from the IANA
 * special-purpose address registries (RFC 6890): this host, loopback, private
 * and link-local networks (cloud metadata services included), carrier-grade
 * NAT, local IPv4/IPv6 translation, protocol assignments (Teredo included),
 * 6to4, documentation, benchmarking, segment routing, multicast and reserved
 * ranges. An IPv4 entry also matches the IPv4-mapped IPv6 form of its
 * addresses.
 */
const NON_PUBLIC_SUBNETS = {
  ipv4: [
    { network: "0.0.0.0", prefix: 8 },
    { network: "10.0.0.0", prefix: 8 },
    { network: "100.64.0.0", prefix: 10 },
    { network: "127.0.0.0", prefix: 8 },
    { network: "169.254.0.0", prefix: 16 },
    { network: "172.16.0.0", prefix: 12 },
    { network: "192.0.0.0", prefix: 24 },
    { network: "192.0.2.0", prefix: 24 },
    { network: "192.88.99.0", prefix: 24 },
    { network: "192.168.0.0", prefix: 16 },
    { network: "198.18.0.0", prefix: 15 },
    { network: "198.51.100.0", prefix: 24 },
    { network: "203.0.113.0", prefix: 24 },
    { network: "224.0.0.0", prefix: 4 },
    { network: "240.0.0.0", prefix: 4 },
  ],
  ipv6: [
    { network: "::", prefix: 96 },
    { network: "64:ff9b:1::", prefix: 48 },
    { network: "100::", prefix: 64 },
    { network: "100:0:0:1::", prefix: 64 },
    { network: "2001::", prefix: 23 },
    { network: "2001:db8::", prefix: 32 },
    { network: "2002::", prefix: 16 },
    { network: "3fff::", prefix: 20 },
    { network: "5f00::", prefix: 16 },
    { network: "fc00::", prefix: 7 },
    { network: "fe80::", prefix: 10 },
    { network: "ff00::", prefix: 8 },
  ],
}

/**
 * NAT64's well-known prefix (RFC 6052). A translator connects an address in it
 * to the IPv4 address in its last 32 bits, private ones included on some
 * networks.
 */
const NAT64_WELL_KNOWN_PREFIX = { network: "64:ff9b::", prefix: 96 }

const nonPublicNetworks = new BlockList()

for (const { network, prefix } of NON_PUBLIC_SUBNETS.ipv4) {
  nonPublicNetworks.addSubnet(network, prefix, "ipv4")
  nonPublicNetworks.addSubnet(
    `${NAT64_WELL_KNOWN_PREFIX.network}${network}`,
    NAT64_WELL_KNOWN_PREFIX.prefix + prefix,
    "ipv6",
  )
}

for (const { network, prefix } of NON_PUBLIC_SUBNETS.ipv6) {
  nonPublicNetworks.addSubnet(network, prefix, "ipv6")
}

export function isPublicAddress(address: string) {
  const family = isIP(address)
  const isIpAddress = family !== 0

  if (!isIpAddress) return false

  return !nonPublicNetworks.check(address, family === 4 ? "ipv4" : "ipv6")
}

function isPublicLookupAddress({ address }: LookupAddress) {
  return isPublicAddress(address)
}

const NON_PUBLIC_ADDRESS_ERROR_CODE = "ERR_NON_PUBLIC_ADDRESS"
const MAX_ERROR_CAUSE_DEPTH = 8

export class NonPublicAddressError extends Error {
  readonly code = NON_PUBLIC_ADDRESS_ERROR_CODE

  constructor(public readonly host: string) {
    super(`${host} does not resolve to a public address only`)
    this.name = "NonPublicAddressError"
  }
}

/**
 * Whether `error` comes from a refused non-public address, however an HTTP
 * client wrapped it: axios keeps the original error as `cause`, node-fetch
 * (under `webdav`) only copies its `code`.
 */
export function isNonPublicAddressError(error: unknown) {
  let current = error

  for (let depth = 0; depth < MAX_ERROR_CAUSE_DEPTH; depth++) {
    if (typeof current !== "object" || current === null) return false

    const isRefusalCode =
      "code" in current && current.code === NON_PUBLIC_ADDRESS_ERROR_CODE

    if (current instanceof NonPublicAddressError || isRefusalCode) return true

    current = "cause" in current ? current.cause : undefined
  }

  return false
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
      const isEveryAddressPublic = addresses.every(isPublicLookupAddress)

      if (!firstAddress || !isEveryAddressPublic) {
        return callback(new NonPublicAddressError(hostname), "")
      }

      if (options.all) return callback(null, addresses)

      callback(null, firstAddress.address, firstAddress.family)
    },
  )
}
