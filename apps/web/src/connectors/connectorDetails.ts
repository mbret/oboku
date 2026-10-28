import type { SettingsConnectorType } from "@oboku/shared"

export const CONNECTOR_DETAILS: Record<
  SettingsConnectorType,
  {
    label: string
  }
> = {
  "synology-drive": {
    label: "Synology",
  },
  webdav: {
    label: "WebDAV",
  },
  server: {
    label: "Server",
  },
  opds: {
    label: "OPDS",
  },
}

export const isSettingsConnectorType = (
  type: string | undefined,
): type is SettingsConnectorType =>
  type !== undefined && Object.hasOwn(CONNECTOR_DETAILS, type)
