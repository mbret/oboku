import { z } from "zod"
import type { BaseDataSourceDocType } from "../../db/docTypes"

export const PLUGIN_SERVER_TYPE = "server"

export type ServerDataSourceDocType = Omit<BaseDataSourceDocType, "data_v2"> & {
  type: "server"
  data_v2?: { connectorId?: string }
}

export type ServerConnectorDocType = {
  id: string
  type: "server"
  username: string
  passwordAsSecretId: string
  url?: string
  allowSelfSigned?: boolean
}

/**
 * API credentials for server plugin: only the secret (password). Username
 * comes from the connector (settings), resolved by the API using link/data connectorId.
 */
export type ServerApiCredentials = {
  password: string
}

export const serverLinkDataSchema = z.object({
  connectorId: z.string().optional(),
  filePath: z.string(),
  etag: z.string().optional(),
})

export type ServerLinkData = z.infer<typeof serverLinkDataSchema>

export function isServerLinkData(data: unknown): data is ServerLinkData {
  return serverLinkDataSchema.safeParse(data).success
}

export const getServerLinkData = (data: Record<string, unknown>) => {
  return serverLinkDataSchema.parse(data)
}
