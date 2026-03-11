import { z } from "zod"

export const webdavLinkDataSchema = z.object({
  connectorId: z.string().optional(),
})

/**
 * API credentials for WebDAV: only the secret (password). URL and username
 * come from the connector (settings), resolved by the API using link/data_v2 connectorId.
 */
export type WebdavApiCredentials = {
  password: string
}
export type WebdavLinkData = z.infer<typeof webdavLinkDataSchema>

export function isWebdavLinkData(data: unknown): data is WebdavLinkData {
  return webdavLinkDataSchema.safeParse(data).success
}

export const getWebDavLinkData = (data: Record<string, unknown>) => {
  return webdavLinkDataSchema.parse(data)
}

/**
 * Normalizes a WebDAV server URL for "same server" matching: strips trailing
 * slashes from pathname and removes query and hash so connectors that differ
 * only by those are treated as the same server.
 *
 * @example
 * normalizeWebdavBaseUrl("https://webdav.example.com/dav/?foo=bar#hash")
 * // => "https://webdav.example.com/dav"
 */
export const normalizeWebdavBaseUrl = (baseUrl: string) => {
  const url = new URL(baseUrl)

  url.pathname = url.pathname.replace(/\/+$/, "")
  url.search = ""
  url.hash = ""

  return url.toString().replace(/\/+$/, "")
}

const WEBDAV_DUMMY_HOST = "_"

export const generateWebdavResourceId = (data: { filename: string }) => {
  return `webdav://${WEBDAV_DUMMY_HOST}:${encodeURIComponent(data.filename)}`
}

export const explodeWebdavResourceId = (resourceId: string) => {
  if (!resourceId.startsWith("webdav://")) {
    throw new Error(`Invalid resource ID format: ${resourceId}`)
  }

  const withoutPrefix = resourceId.substring("webdav://".length)
  const lastColonIndex = withoutPrefix.lastIndexOf(":")
  if (lastColonIndex === -1) {
    throw new Error(`Invalid resource ID format: ${resourceId}`)
  }
  const encodedFilename = withoutPrefix.substring(lastColonIndex + 1)
  const filename = decodeURIComponent(encodedFilename)

  const lastSlashIndex = filename.lastIndexOf("/")
  const directory =
    lastSlashIndex !== -1 ? `/${filename.substring(0, lastSlashIndex)}` : "/"
  const basename =
    lastSlashIndex !== -1 ? filename.substring(lastSlashIndex + 1) : filename

  return { filename, directory, basename }
}
