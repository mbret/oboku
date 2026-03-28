import { z } from "zod"

export const PLUGIN_SERVER_TYPE = "server"

/**
 * API credentials for server plugin: only the secret (password). Username
 * comes from the connector (settings), resolved by the API using link/data connectorId.
 */
export type ServerApiCredentials = {
  password: string
}

export const serverLinkDataSchema = z.object({
  connectorId: z.string().optional(),
  etag: z.string().optional(),
})

export type ServerLinkData = z.infer<typeof serverLinkDataSchema>

export function isServerLinkData(data: unknown): data is ServerLinkData {
  return serverLinkDataSchema.safeParse(data).success
}

export const getServerLinkData = (data: Record<string, unknown>) => {
  return serverLinkDataSchema.parse(data)
}

export const generateServerResourceId = (data: { filePath: string }) => {
  return `server://${encodeURIComponent(data.filePath)}`
}

export const explodeServerResourceId = (resourceId: string) => {
  if (!resourceId.startsWith("server://")) {
    throw new Error(`Invalid resource ID format: ${resourceId}`)
  }

  const filePath = decodeURIComponent(resourceId.substring("server://".length))

  if (!filePath) {
    throw new Error(`Invalid resource ID format: ${resourceId}`)
  }

  return { filePath }
}
