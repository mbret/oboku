import { z } from "zod"
import type { BaseDataSourceDocType } from "../../db/docTypes"

/** WebDAV datasource config: connector reference plus optional sync directory. */
export type WebDAVDataSourceDocType = Omit<BaseDataSourceDocType, "data_v2"> & {
  type: "webdav"
  data_v2?: { connectorId?: string; directory?: string }
}

export type WebdavConnectorDocType = {
  id: string
  url: string
  username: string
  passwordAsSecretId: string
  allowSelfSigned?: boolean
  type: "webdav"
}

export const webdavLinkDataSchema = z.object({
  connectorId: z.string().optional(),
  filePath: z.string(),
  etag: z.string().optional(),
})

/**
 * API credentials for WebDAV: only the secret (password). URL and username
 * come from the connector (settings), resolved by the API using link/data_v2 connectorId.
 */
export const webdavApiCredentialsSchema = z.object({
  password: z.string().min(1),
})

export type WebdavApiCredentials = z.infer<typeof webdavApiCredentialsSchema>
export type WebdavLinkData = z.infer<typeof webdavLinkDataSchema>
