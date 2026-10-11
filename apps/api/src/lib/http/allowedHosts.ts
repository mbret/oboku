import { isIP } from "node:net"

/** A host the address check lets through: on every port, or on `port` only. */
export type AllowedHost = {
  hostname: string
  port?: number
}

const URL_SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:\/\//i

const DEFAULT_PORTS: Record<string, number> = {
  "http:": 80,
  "https:": 443,
}

/** As a connection names its host: lowercase, an IPv6 address unbracketed. */
export function toComparableHostname(hostname: string) {
  return hostname.replace(/^\[|\]$/g, "").toLowerCase()
}

function parseUrl(value: string) {
  try {
    return new URL(value)
  } catch {
    return undefined
  }
}

/**
 * Reads a host as an admin writes it: `host`, `host:port`, an IPv6 address (in
 * brackets when a port follows), or an http(s) URL, of which only the host and
 * the port count. A URL without a port stands for its scheme's default port; a
 * host without one allows every port.
 */
export function parseAllowedHost(entry: string): AllowedHost | undefined {
  const trimmedEntry = entry.trim()
  const isUrl = URL_SCHEME_PATTERN.test(trimmedEntry)
  const isBareIpv6 = isIP(trimmedEntry) === 6
  const url = parseUrl(
    isUrl
      ? trimmedEntry
      : `http://${isBareIpv6 ? `[${trimmedEntry}]` : trimmedEntry}`,
  )
  const defaultPort = url ? DEFAULT_PORTS[url.protocol] : undefined

  if (!url || defaultPort === undefined) return undefined

  const isHostOnly =
    url.username === "" &&
    url.password === "" &&
    url.pathname === "/" &&
    url.search === "" &&
    url.hash === ""

  if (!isUrl && !isHostOnly) return undefined

  const hostname = toComparableHostname(url.hostname)

  if (url.port !== "") return { hostname, port: Number(url.port) }

  const isPortWritten = !isBareIpv6 && /:\d+\/?$/.test(trimmedEntry)

  return isUrl || isPortWritten ? { hostname, port: defaultPort } : { hostname }
}

/** `host` or `host:port`, as the admin panel shows an allowed host. */
export function formatAllowedHost({ hostname, port }: AllowedHost) {
  const host = isIP(hostname) === 6 ? `[${hostname}]` : hostname

  return port === undefined ? host : `${host}:${port}`
}

export function isAllowedHost(
  allowedHosts: AllowedHost[],
  connection: { hostname: string; port: number },
) {
  return allowedHosts.some(function isConnectionAllowedBy({ hostname, port }) {
    const isSameHost = hostname === connection.hostname
    const isAnyPortAllowed = port === undefined

    return isSameHost && (isAnyPortAllowed || port === connection.port)
  })
}
