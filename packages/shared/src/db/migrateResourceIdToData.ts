const safeDecodeURIComponent = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const stripPrefix = (value: string, prefix: string) =>
  value.startsWith(prefix) ? value.substring(prefix.length) : value

/**
 * Parses a legacy `resourceId` / `linkResourceId` string and returns the
 * identity fields to merge into `data` / `linkData` for the given provider
 * type.
 *
 * @returns `null` when the provider type carries no identity in its legacy
 * resourceId, meaning there is nothing to migrate.
 */
export function migrateResourceIdToData(
  type: string,
  resourceId: string,
  existingData: Record<string, unknown> | null,
): Record<string, unknown> | null {
  const base = existingData ?? {}

  switch (type) {
    case "DRIVE":
      return { ...base, fileId: stripPrefix(resourceId, "drive-") }

    case "dropbox":
      return { ...base, fileId: stripPrefix(resourceId, "dropbox-") }

    case "webdav": {
      const withoutPrefix = stripPrefix(resourceId, "webdav://")
      // Legacy ids came as `webdav://{host}:{encoded filePath}`, with the host
      // portion later dropped from the format.
      const encodedFilePath = withoutPrefix.includes(":")
        ? withoutPrefix.substring(withoutPrefix.lastIndexOf(":") + 1)
        : withoutPrefix

      return { ...base, filePath: safeDecodeURIComponent(encodedFilePath) }
    }

    case "synology-drive":
      return {
        ...base,
        fileId: safeDecodeURIComponent(
          stripPrefix(resourceId, "synology-drive://"),
        ),
      }

    case "server":
      return {
        ...base,
        filePath: safeDecodeURIComponent(stripPrefix(resourceId, "server://")),
      }

    case "URI":
      return { ...base, url: stripPrefix(resourceId, "oboku-link-") }

    default:
      return null
  }
}
