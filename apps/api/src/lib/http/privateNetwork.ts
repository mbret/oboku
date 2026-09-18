import { isIP } from "node:net"

const IPV4_MAPPED_IPV6_PREFIX = /^::ffff:/i

const parseIpv4Octets = (address: string) => {
  const octets = address.split(".").map(Number)

  if (octets.length !== 4) return undefined
  if (
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  )
    return undefined

  return octets as [number, number, number, number]
}

const isPrivateIpv4 = (address: string) => {
  const octets = parseIpv4Octets(address)

  if (!octets) return true

  const [first, second] = octets

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  )
}

const isPrivateIpv6 = (address: string) => {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "")

  if (IPV4_MAPPED_IPV6_PREFIX.test(normalized)) {
    return isPrivateIpv4(normalized.replace(IPV4_MAPPED_IPV6_PREFIX, ""))
  }

  if (normalized === "::" || normalized === "::1") return true

  const firstHextet = normalized.split(":")[0] ?? ""

  /** fc00::/7 unique-local, fe80::/10 link-local, ff00::/8 multicast */
  return (
    /^f[cd]/.test(firstHextet) ||
    /^fe[89ab]/.test(firstHextet) ||
    /^ff/.test(firstHextet)
  )
}

/**
 * Whether an already-resolved IP literal belongs to a range that is not
 * routable on the public internet. Unparseable input is reported as
 * private so a malformed address can never be treated as safe.
 */
export const isPrivateAddress = (address: string) => {
  const family = isIP(address)

  if (family === 4) return isPrivateIpv4(address)
  if (family === 6) return isPrivateIpv6(address)

  return true
}
