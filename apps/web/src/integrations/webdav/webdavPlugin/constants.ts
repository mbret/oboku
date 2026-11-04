import type { ConnectorDetails } from "../../plugins/types"
import { ROUTES } from "../../../navigation/routes"

export const TYPE = `webdav`

export type WebdavBackedType = "webdav" | "server"

export const CONNECTOR = {
  type: TYPE,
  label: "WebDAV",
  integrationRoute: ROUTES.INTEGRATION_WEBDAV,
} satisfies ConnectorDetails<"webdav">
