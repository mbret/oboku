import type { SettingsConnectorType } from "./db/docTypes"

/** The connector types oboku's server can sign in to. */
export const CONNECTABLE_CONNECTOR_TYPES = [
  "webdav",
] as const satisfies ReadonlyArray<SettingsConnectorType>

export type ConnectableConnectorType =
  (typeof CONNECTABLE_CONNECTOR_TYPES)[number]

/** The connector types whose books the OPDS catalogs serve. */
export const OPDS_SERVED_CONNECTOR_TYPES = [
  "webdav",
] as const satisfies ReadonlyArray<ConnectableConnectorType>

export type OpdsServedConnectorType =
  (typeof OPDS_SERVED_CONNECTOR_TYPES)[number]

export const isConnectableConnectorType = (
  type: SettingsConnectorType,
): type is ConnectableConnectorType =>
  CONNECTABLE_CONNECTOR_TYPES.some(
    (connectableType) => connectableType === type,
  )
