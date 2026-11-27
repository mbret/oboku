import type {
  SettingsConnectorDocType,
  SettingsConnectorType,
} from "@oboku/shared"
import type createNano from "nano"
import { getSettings } from "../couch/dbHelpers.js"

type ConnectorOfType<T extends SettingsConnectorType> = Extract<
  SettingsConnectorDocType,
  { type: T }
>

export class ConnectorNotConfiguredError extends Error {
  constructor() {
    super("No connector is configured")
  }
}

export class ConnectorNotFoundError extends Error {
  constructor() {
    super("Connector not found")
  }
}

/**
 * Fetches a single connector by id and type from the user's settings.
 * Used to resolve url/username from connector when API credentials only hold the password.
 */
export async function getConnectorById<T extends SettingsConnectorType>(
  db: createNano.DocumentScope<unknown>,
  connectorId: string,
  connectorType: T,
): Promise<ConnectorOfType<T> | null> {
  const settings = await getSettings(db)
  const connectors = settings?.connectors ?? []
  const connector = connectors.find(
    function isRequestedConnector(candidate): candidate is ConnectorOfType<T> {
      return candidate.id === connectorId && candidate.type === connectorType
    },
  )

  return connector ?? null
}

/**
 * The connector of type `type` that `connectorId` names in the user's
 * settings.
 *
 * @throws `ConnectorNotConfiguredError` without `connectorId`, and
 * `ConnectorNotFoundError` when the settings hold no such connector.
 */
export const findConnector = async <T extends SettingsConnectorType>({
  db,
  connectorId,
  type,
}: {
  db: createNano.DocumentScope<unknown>
  connectorId: string | undefined
  type: T
}) => {
  if (!connectorId) throw new ConnectorNotConfiguredError()

  const connector = await getConnectorById(db, connectorId, type)

  if (!connector) throw new ConnectorNotFoundError()

  return connector
}
