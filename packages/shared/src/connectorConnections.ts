import type { SettingsConnectorType } from "./db/docTypes"

/** The connector types oboku's server can sign in to. */
export const CONNECTABLE_CONNECTOR_TYPES = [
  "webdav",
] as const satisfies ReadonlyArray<SettingsConnectorType>

export type ConnectableConnectorType =
  (typeof CONNECTABLE_CONNECTOR_TYPES)[number]

export const isConnectableConnectorType = (
  type: SettingsConnectorType,
): type is ConnectableConnectorType =>
  CONNECTABLE_CONNECTOR_TYPES.some(
    (connectableType) => connectableType === type,
  )
