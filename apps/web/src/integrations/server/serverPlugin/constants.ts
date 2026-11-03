import type { ConnectorDetails } from "../../plugins/types"
import { ROUTES } from "../../../navigation/routes"

export const TYPE = "server"

export const CONNECTOR = {
  type: TYPE,
  label: "Server",
  integrationRoute: ROUTES.INTEGRATION_SERVER,
} satisfies ConnectorDetails<"server">
