import { z } from "zod"

export const PLUGIN_SERVER_TYPE = "server"

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

export const generateServerResourceId = (data: { filename: string }) => {
  return `server://${encodeURIComponent(data.filename)}`
}

export const explodeServerResourceId = (resourceId: string) => {
  if (!resourceId.startsWith("server://")) {
    throw new Error(`Invalid resource ID format: ${resourceId}`)
  }

  const filename = decodeURIComponent(resourceId.substring("server://".length))

  if (!filename) {
    throw new Error(`Invalid resource ID format: ${resourceId}`)
  }

  return { filename }
}
