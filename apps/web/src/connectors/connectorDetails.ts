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
    newRoute: ROUTES.PLUGINS_CONNECTORS_NEW.replace(":type", "synology-drive"),
    editRoute: ROUTES.PLUGINS_CONNECTORS_EDIT.replace(
      ":type",
      "synology-drive",
    ),
  },
  webdav: {
    label: "WebDAV",
    manageRoute: ROUTES.PLUGINS_TYPE.replace(":type", "webdav"),
    newRoute: ROUTES.PLUGINS_CONNECTORS_NEW.replace(":type", "webdav"),
    editRoute: ROUTES.PLUGINS_CONNECTORS_EDIT.replace(":type", "webdav"),
  },
  server: {
    label: "Server",
    manageRoute: ROUTES.PLUGINS_TYPE.replace(":type", "server"),
    newRoute: ROUTES.PLUGINS_CONNECTORS_NEW.replace(":type", "server"),
    editRoute: ROUTES.PLUGINS_CONNECTORS_EDIT.replace(":type", "server"),
  },
}
