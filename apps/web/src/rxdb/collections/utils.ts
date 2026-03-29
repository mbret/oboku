export const generateId = () => crypto.randomUUID()

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * Parses a legacy resourceId string and returns the identity fields to merge
 * into a data object for the given provider type.
 */
export function migrateResourceIdToData(
  type: string,
  resourceId: string | undefined,
  existingData: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const base = existingData ?? {}

  if (!resourceId) return base

  switch (type) {
    case "DRIVE":
      return { ...base, fileId: resourceId.replace("drive-", "") }

    case "dropbox":
      return { ...base, fileId: resourceId.replace("dropbox-", "") }

    case "webdav": {
      const withoutPrefix = resourceId.startsWith("webdav://")
        ? resourceId.substring("webdav://".length)
        : resourceId
      // Strip the host portion from the legacy "webdav://host:encodedPath"
      // format. Must stay in sync with the server-side migration in
      // migration.service.ts so both produce the same filePath.
      const encodedFilePath = withoutPrefix.includes(":")
        ? withoutPrefix.substring(withoutPrefix.lastIndexOf(":") + 1)
        : withoutPrefix
      return { ...base, filePath: safeDecodeURIComponent(encodedFilePath) }
    }

    case "synology-drive": {
      const withoutPrefix = resourceId.startsWith("synology-drive://")
        ? resourceId.substring("synology-drive://".length)
        : resourceId
      const fileId = safeDecodeURIComponent(withoutPrefix)
      return { ...base, fileId }
    }

    case "server": {
      const withoutPrefix = resourceId.startsWith("server://")
        ? resourceId.substring("server://".length)
        : resourceId
      const filePath = safeDecodeURIComponent(withoutPrefix)
      return { ...base, filePath }
    }

    case "URI":
      return { ...base, url: resourceId.replace("oboku-link-", "") }

    case "file":
      return base

    default:
      return base
  }
}
