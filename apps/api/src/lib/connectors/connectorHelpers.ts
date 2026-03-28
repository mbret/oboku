import type {
  WebdavConnectorDocType,
  SynologyDriveConnectorDocType,
  SettingsConnectorDocType,
  SettingsConnectorType,
} from "@oboku/shared"
import type createNano from "nano"
import { getSettings } from "src/lib/couch/dbHelpers"

/**
 * Fetches a single connector by id and type from the user's settings.
 * Used to resolve url/username from connector when API credentials only hold the password.
 */
export async function getConnectorById(
  db: createNano.DocumentScope<unknown>,
  connectorId: string,
  connectorType: "webdav",
): Promise<WebdavConnectorDocType | null>

export async function getConnectorById(
  db: createNano.DocumentScope<unknown>,
  connectorId: string,
  connectorType: "synology-drive",
): Promise<SynologyDriveConnectorDocType | null>

export async function getConnectorById(
  db: createNano.DocumentScope<unknown>,
  connectorId: string,
  connectorType: SettingsConnectorType,
): Promise<SettingsConnectorDocType | null> {
  const settings = await getSettings(db)
  const connectors = settings?.connectors ?? []
  const connector = connectors.find(
    (c) => c.id === connectorId && c.type === connectorType,
  )

  return connector ?? null
}

/**
 * Returns all connector IDs that point to the same server as the given
 * connector, using a provider-specific URL normalization. Used by webdav and
 * synology-drive so links and collections match across connectors that target
 * the same server.
 *
 * @returns `null` when the connector is missing or has no URL (caller should return empty results); otherwise the list of connector IDs with the same normalized URL.
 */
export async function getConnectorIdsWithSameServer(
  db: createNano.DocumentScope<unknown>,
  options: {
    connectorId: string
    connectorType: "webdav" | "synology-drive"
    normalizeUrl: (url: string) => string
  },
): Promise<string[] | null> {
  const { connectorId, connectorType, normalizeUrl } = options

  const settings = await getSettings(db)
  const connectors = settings?.connectors ?? []
  const connector = connectors.find(
    (c) => c.id === connectorId && c.type === connectorType,
  )
  const url = connector?.url

  if (!url || typeof url !== "string") {
    return null
  }

  const normalizedUrl = normalizeUrl(url)
  const connectorIdsWithSameUrl = connectors
    .filter(
      (c) =>
        c.type === connectorType &&
        typeof c.url === "string" &&
        normalizeUrl(c.url) === normalizedUrl,
    )
    .map((c) => c.id)

  return connectorIdsWithSameUrl
}
