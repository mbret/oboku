import { PLUGIN_SYNOLOGY_DRIVE_TYPE } from "@oboku/shared"
import type { ConnectorDetails } from "../../plugins/types"
import { ROUTES } from "../../../navigation/routes"

export const CONNECTOR = {
  type: PLUGIN_SYNOLOGY_DRIVE_TYPE,
  label: "Synology",
  integrationRoute: ROUTES.INTEGRATION_SYNOLOGY_DRIVE,
} satisfies ConnectorDetails<"synology-drive">
