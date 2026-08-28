import type {
  WebdavConnectorDocType,
  SynologyDriveConnectorDocType,
  ServerConnectorDocType,
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
  connectorType: "server",
): Promise<ServerConnectorDocType | null>

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
