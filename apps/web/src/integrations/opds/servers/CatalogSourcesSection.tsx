import { BlockRounded } from "@mui/icons-material"
import { ListItem, ListItemIcon, ListItemText } from "@mui/material"
import type { ConnectableConnectorType, DataSourceDocType } from "@oboku/shared"
import { ListItemLink } from "../../../common/lists"
import { PageSection } from "../../../common/PageSection"
import { useConfig } from "../../../config/useConfig"
import { CONNECTOR_DETAILS } from "../../../connectors/connectorDetails"
import { ROUTES } from "../../../navigation/routes"
import { plugin as googleDrivePlugin } from "../../google/googleDrivePlugin"
import { getPluginByType, type Plugin, plugins } from "../../plugins/configure"
import { useGetIsPluginVisible } from "../../plugins/useIsPluginEnabled"

// The connector types `isLinkServed` (apps/api/src/opds/opds-books.ts) serves.
const SERVED_CONNECTOR_TYPES = [
  "webdav",
] as const satisfies ReadonlyArray<ConnectableConnectorType>

function UnservedSourcesItem({
  unservedPlugins,
}: {
  unservedPlugins: Plugin[]
}) {
  if (unservedPlugins.length === 0) return null

  const names = unservedPlugins
    .map(({ name }) => name)
    .toSorted((a, b) => a.localeCompare(b, "en"))
    .join(", ")

  return (
    <ListItem>
      <ListItemIcon>
        <BlockRounded />
      </ListItemIcon>
      <ListItemText primary="Not available yet" secondary={names} />
    </ListItem>
  )
}

export function CatalogSourcesSection() {
  const { data: config } = useConfig()
  const isPluginVisible = useGetIsPluginVisible()
  const isGoogleDriveServed = !!config?.FEATURE_GOOGLE_CONNECTION_ENABLED
  const servedTypes: ReadonlyArray<DataSourceDocType["type"]> =
    isGoogleDriveServed
      ? [googleDrivePlugin.type, ...SERVED_CONNECTOR_TYPES]
      : SERVED_CONNECTOR_TYPES
  const unservedPlugins = plugins.filter(
    (plugin) => isPluginVisible(plugin) && !servedTypes.includes(plugin.type),
  )

  return (
    <PageSection title="What catalogs list">
      <ListItem>
        <ListItemText secondary="Catalogs list the books of these sources once you connect them on their screen. They leave out books under a protected tag or marked not interested." />
      </ListItem>
      {isGoogleDriveServed && (
        <ListItemLink
          to={ROUTES.INTEGRATION_GOOGLE}
          icon={<googleDrivePlugin.Icon />}
          primary={googleDrivePlugin.name}
        />
      )}
      {SERVED_CONNECTOR_TYPES.map(function toServedConnectorTypeItem(type) {
        const { Icon, name } = getPluginByType(type)

        return (
          <ListItemLink
            key={type}
            to={CONNECTOR_DETAILS[type].integrationRoute}
            icon={<Icon />}
            primary={name}
          />
        )
      })}
      <UnservedSourcesItem unservedPlugins={unservedPlugins} />
    </PageSection>
  )
}
