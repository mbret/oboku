import type { SettingsConnectorType } from "@oboku/shared"
import { ROUTES } from "../navigation/routes"

export const CONNECTOR_DETAILS: Record<
  SettingsConnectorType,
  {
    label: string
    integrationRoute: string
  }
> = {
  "synology-drive": {
    label: "Synology",
    integrationRoute: ROUTES.INTEGRATION_SYNOLOGY_DRIVE,
  },
  webdav: {
    label: "WebDAV",
    integrationRoute: ROUTES.INTEGRATION_WEBDAV,
  },
  server: {
    label: "Server",
    integrationRoute: ROUTES.INTEGRATION_SERVER,
  },
  opds: {
    label: "OPDS",
    integrationRoute: ROUTES.INTEGRATION_OPDS,
  },
}

export const isSettingsConnectorType = (
  type: string | undefined,
): type is SettingsConnectorType =>
  type !== undefined && Object.hasOwn(CONNECTOR_DETAILS, type)
