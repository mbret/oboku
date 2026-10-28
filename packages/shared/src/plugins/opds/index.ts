import { z } from "zod"
import type { BaseDataSourceDocType } from "../../db/docTypes"

export const PLUGIN_OPDS_TYPE = "opds"

/** OPDS datasource config: connector reference plus the absolute URL of the feed to sync. */
export type OpdsDataSourceDocType = Omit<BaseDataSourceDocType, "data_v2"> & {
  type: "opds"
  data_v2?: { connectorId?: string; feedUrl?: string }
}

export type OpdsConnectorDocType = {
  id: string
  url: string
  username: string
  passwordAsSecretId: string
  allowSelfSigned?: boolean
  type: "opds"
}

/**
 * A book: `connectorId` and `entryId` identify it. The rest is what the last
 * sync saw: OPDS has no request for a single entry, so metadata refreshes and
 * downloads read it from here.
 */
const opdsBookLinkDataSchema = z.object({
  connectorId: z.string().optional(),
  entryId: z.string(),
  title: z.string().optional(),
  acquisition: z.object({
    href: z.string(),
    type: z.string(),
    length: z.number().optional(),
  }),
})

/**
 * A folder: `connectorId` and the feed its navigation entry leads to identify
 * it. Entry ids cannot: Kavita numbers its libraries, series and collections
 * from 1 each.
 */
const opdsFolderLinkDataSchema = z.object({
  connectorId: z.string().optional(),
  feedUrl: z.string(),
  title: z.string().optional(),
})

export const opdsLinkDataSchema = z.union([
  opdsBookLinkDataSchema,
  opdsFolderLinkDataSchema,
])

/**
 * API credentials for OPDS: only the secret (password). URL and username
 * come from the connector (settings), resolved by the API using link/data_v2 connectorId.
 */
export const opdsApiCredentialsSchema = z.object({
  password: z.string().min(1),
})

export type OpdsApiCredentials = z.infer<typeof opdsApiCredentialsSchema>
export type OpdsBookLinkData = z.infer<typeof opdsBookLinkDataSchema>
export type OpdsFolderLinkData = z.infer<typeof opdsFolderLinkDataSchema>
export type OpdsLinkData = z.infer<typeof opdsLinkDataSchema>

const HTTP_PROTOCOLS = ["http:", "https:"]

/** The origin of an absolute http(s) URL, undefined for anything else. */
export const getOpdsUrlOrigin = (url: string) => {
  if (!URL.canParse(url)) return undefined

  const { origin, protocol } = new URL(url)

  return HTTP_PROTOCOLS.includes(protocol) ? origin : undefined
}

/**
 * Whether a request to `url` may carry the credentials of the connector at
 * `connectorUrl`: only a request to the connector's origin does. Catalogs
 * often serve their files from another host, such as a CDN.
 */
export const isOpdsConnectorOrigin = (url: string, connectorUrl: string) => {
  const origin = getOpdsUrlOrigin(url)

  return origin !== undefined && origin === getOpdsUrlOrigin(connectorUrl)
}

/** Basic credentials are UTF-8 (RFC 7617, section 2.1). */
const toBasicCredentials = (username: string, password: string) =>
  btoa(
    String.fromCharCode(...new TextEncoder().encode(`${username}:${password}`)),
  )

/**
 * The headers that authenticate a request to `url` with the connector's
 * credentials: none unless {@link isOpdsConnectorOrigin}.
 */
export const getOpdsCredentialHeaders = (
  url: string,
  connector: { url: string; username: string; password: string },
): Record<string, string> =>
  isOpdsConnectorOrigin(url, connector.url)
    ? {
        Authorization: `Basic ${toBasicCredentials(connector.username, connector.password)}`,
      }
    : {}
