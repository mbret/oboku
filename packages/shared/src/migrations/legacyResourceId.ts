export type LegacyResourceIdLinkData =
  | { fileId: string }
  | { filePath: string }
  | { url: string }

function decodeURIComponentOrKeep(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function stripPrefix(value: string, prefix: string): string {
  return value.startsWith(prefix) ? value.substring(prefix.length) : value
}

/**
 * Frozen snapshot of the legacy link `resourceId` scheme, used by the RxDB
 * migration on devices and the CouchDB migration in the API so both write the
 * same link data. Data migrations must keep producing the same output, so this
 * never follows runtime parsing changes and is never used outside a migration.
 *
 * Returns the identity fields the `resourceId` of a link of `type` encodes, or
 * `undefined` when the type stores none (`file`) or is unknown.
 */
export function parseLegacyResourceIdForMigration(
  type: string,
  resourceId: string,
): LegacyResourceIdLinkData | undefined {
  switch (type) {
    case "DRIVE":
      return { fileId: stripPrefix(resourceId, "drive-") }

    case "dropbox":
      return { fileId: stripPrefix(resourceId, "dropbox-") }

    case "webdav": {
      const hostAndEncodedFilePath = stripPrefix(resourceId, "webdav://")
      const isHostBasedFormat = hostAndEncodedFilePath.includes(":")
      const encodedFilePath = isHostBasedFormat
        ? hostAndEncodedFilePath.substring(
            hostAndEncodedFilePath.lastIndexOf(":") + 1,
          )
        : hostAndEncodedFilePath
      return { filePath: decodeURIComponentOrKeep(encodedFilePath) }
    }

    case "synology-drive":
      return {
        fileId: decodeURIComponentOrKeep(
          stripPrefix(resourceId, "synology-drive://"),
        ),
      }

    case "server":
      return {
        filePath: decodeURIComponentOrKeep(
          stripPrefix(resourceId, "server://"),
        ),
      }

    case "URI":
      return { url: stripPrefix(resourceId, "oboku-link-") }

    default:
      return undefined
  }
}
