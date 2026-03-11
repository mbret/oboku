import { ROUTES } from "../navigation/routes"
import type { SettingsConnectorType } from "@oboku/shared"

export const CONNECTOR_DETAILS: Record<
  SettingsConnectorType,
  {
    label: string
    manageRoute: string
    newRoute: string
    editRoute: string
  }
> = {
  "synology-drive": {
    label: "Synology",
    manageRoute: ROUTES.PLUGINS_TYPE.replace(":type", "synology-drive"),
    newRoute: ROUTES.PLUGINS_SYNOLOGY_DRIVE_CONNECTORS_NEW,
    editRoute: ROUTES.PLUGINS_SYNOLOGY_DRIVE_CONNECTORS_EDIT,
  },
  webdav: {
    label: "WebDAV",
    manageRoute: ROUTES.PLUGINS_TYPE.replace(":type", "webdav"),
    newRoute: ROUTES.PLUGINS_WEBDAV_CONNECTORS_NEW,
    editRoute: ROUTES.PLUGINS_WEBDAV_CONNECTORS_EDIT,
  },
}
