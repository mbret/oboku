import { type LookupAddress, lookup as dnsLookup } from "node:dns"
import { BlockList, isIP, type LookupFunction } from "node:net"
import { networkInterfaces } from "node:os"

/**
 * Networks that do not lead to the public internet, from the IANA
 * special-purpose address registries (RFC 6890): this host, loopback, private
 * and link-local networks (cloud metadata services included), carrier-grade
 * NAT, protocol assignments (Teredo included), 6to4, documentation,
 * benchmarking, multicast and reserved ranges. The IPv6 entries are the ones
 * inside `PUBLIC_IPV6_SUBNETS`, outside of which no IPv6 address is public. An
 * IPv4 entry also matches the IPv4-mapped IPv6 form of its addresses.
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
    { network: "2001::", prefix: 23 },
    { network: "2001:db8::", prefix: 32 },
    { network: "2002::", prefix: 16 },
    { network: "3fff::", prefix: 20 },
  ],
}

/**
 * NAT64's well-known prefix (RFC 6052). A translator connects an address in it
 * to the IPv4 address in its last 32 bits, private ones included on some
 * networks.
 */
const NAT64_WELL_KNOWN_PREFIX = { network: "64:ff9b::", prefix: 96 }

/**
 * The only IPv6 space where an address can be public: global unicast (IANA
 * IPv6 address space registry), and the IPv4-mapped and NAT64 forms of IPv4
 * addresses, which the IPv4 entries judge.
 */
const PUBLIC_IPV6_SUBNETS = [
  { network: "2000::", prefix: 3 },
  { network: "::ffff:0:0", prefix: 96 },
  NAT64_WELL_KNOWN_PREFIX,
]

function toNat64Address(ipv4Address: string) {
  return `${NAT64_WELL_KNOWN_PREFIX.network}${ipv4Address}`
}

const nonPublicNetworks = new BlockList()

for (const { network, prefix } of NON_PUBLIC_SUBNETS.ipv4) {
  nonPublicNetworks.addSubnet(network, prefix, "ipv4")
  nonPublicNetworks.addSubnet(
    toNat64Address(network),
    NAT64_WELL_KNOWN_PREFIX.prefix + prefix,
    "ipv6",
  )
}

for (const { network, prefix } of NON_PUBLIC_SUBNETS.ipv6) {
  nonPublicNetworks.addSubnet(network, prefix, "ipv6")
}

const publicIpv6Networks = new BlockList()

for (const { network, prefix } of PUBLIC_IPV6_SUBNETS) {
  publicIpv6Networks.addSubnet(network, prefix, "ipv6")
}

/** Read on every check: interfaces and their addresses come and go. */
function getServerAddresses() {
  const serverAddresses = new BlockList()

  for (const interfaceAddresses of Object.values(networkInterfaces())) {
    for (const { address, family } of interfaceAddresses ?? []) {
      if (family === "IPv4") {
        serverAddresses.addAddress(address, "ipv4")
        serverAddresses.addAddress(toNat64Address(address), "ipv6")
      } else {
        serverAddresses.addAddress(address, "ipv6")
      }
    }
  }

  return serverAddresses
}

/**
 * Whether a connection to `address` reaches the public internet: it is not a
 * special-purpose address, nor one of this server's own addresses, whose
 * connections never leave the machine whatever their range.
 */
export function isPublicAddress(address: string) {
  const family = isIP(address)
  const isIpAddress = family !== 0

  if (!isIpAddress) return false

  const type = family === 4 ? "ipv4" : "ipv6"
  const isServerAddress = getServerAddresses().check(address, type)

  if (isServerAddress) return false
  if (type === "ipv4") return !nonPublicNetworks.check(address, type)

  const isInPublicIpv6Space = publicIpv6Networks.check(address, type)

  return isInPublicIpv6Space && !nonPublicNetworks.check(address, type)
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
