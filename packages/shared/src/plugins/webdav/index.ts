import { z } from "zod"

export const webdavSyncDataSchema = z.object({
  password: z.string(),
  username: z.string(),
  url: z.string(),
})

export const webdavLinkDataSchema = z.object({
  connectorId: z.string().optional(),
})

// Extract TypeScript types from Zod schemas
export type WebdavSyncData = z.infer<typeof webdavSyncDataSchema>
export type WebdavLinkData = z.infer<typeof webdavLinkDataSchema>

export const getWebdavSyncData = (data: Record<string, unknown>) => {
  return webdavSyncDataSchema.parse(data)
}

export const getWebDavLinkData = (data: Record<string, unknown>) => {
  return webdavLinkDataSchema.parse(data)
}

export const generateWebdavResourceId = (data: {
  url: string
  filename: string
}) => {
  return `webdav://${new URL(data.url ?? "").hostname}:${encodeURIComponent(data.filename)}`
}

export const explodeWebdavResourceId = (resourceId: string) => {
  // Check if the resource ID has the expected format
  if (!resourceId.startsWith("webdav://")) {
    throw new Error(`Invalid resource ID format: ${resourceId}`)
  }

  // Remove the "webdav://" prefix
  const withoutPrefix = resourceId.substring("webdav://".length)

  // Find the last colon which separates hostname from filename
  const lastColonIndex = withoutPrefix.lastIndexOf(":")
  if (lastColonIndex === -1) {
    throw new Error(`Invalid resource ID format: ${resourceId}`)
  }

  const url = withoutPrefix.substring(0, lastColonIndex)
  const encodedFilename = withoutPrefix.substring(lastColonIndex + 1)
  const filename = decodeURIComponent(encodedFilename)

  // Extract directory and basename from filename
  const lastSlashIndex = filename.lastIndexOf("/")
  const directory =
    lastSlashIndex !== -1 ? `/${filename.substring(0, lastSlashIndex)}` : "/"
  const basename =
    lastSlashIndex !== -1 ? filename.substring(lastSlashIndex + 1) : filename

  return { url, filename, directory, basename }
}
