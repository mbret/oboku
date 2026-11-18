import { BlockRounded } from "@mui/icons-material"
import { ListItem, ListItemIcon, ListItemText } from "@mui/material"
import type {
  ConnectableConnectorType,
  ConnectorConnectionDto,
  DataSourceDocType,
} from "@oboku/shared"
import type { UseQueryResult } from "@tanstack/react-query"
import { generatePath } from "react-router"
import { ListItemLink } from "../../../common/lists"
import { PageSection } from "../../../common/PageSection"
import { useConfig } from "../../../config/useConfig"
import { toConnectorLabel } from "../../../connectors/connectorDetails"
import { useConnectorConnection } from "../../../connectors/connection/useConnectorConnection"
import { useConnectors } from "../../../connectors/useConnectors"
import { ROUTES } from "../../../navigation/routes"
import { isQueryUnavailable } from "../../../queries/isQueryUnavailable"
import { useGoogleConnection } from "../../google/connection/useGoogleConnection"
import { plugin as googleDrivePlugin } from "../../google/googleDrivePlugin"
import { getPluginByType, type Plugin, plugins } from "../../plugins/configure"
import { useGetIsPluginVisible } from "../../plugins/useIsPluginEnabled"

// The connector types `isLinkServed` (apps/api/src/opds/opds-books.ts) serves.
const SERVED_CONNECTOR_TYPES = [
  "webdav",
] as const satisfies ReadonlyArray<ConnectableConnectorType>

type SourceState =
  | "set-up"
  | "google-not-connected"
  | "connector-not-connected"
  | "connector-changed"
  | "no-connector"

const SOURCE_STATES: Record<SourceState, string> = {
  "set-up": "Set up. Catalogs list its books.",
  "google-not-connected": "Not set up. Connect your Google account.",
  "connector-not-connected": "Not set up. Connect this connector.",
  "connector-changed":
    "Not set up. You changed this connector or its password. Connect it again.",
  "no-connector": "Not set up. Add a connector, then connect it.",
}

const CONNECTION_STATES: Record<ConnectorConnectionDto["status"], SourceState> =
  {
    connected: "set-up",
    "connector-changed": "connector-changed",
  }

const describeSourceState = <TData,>({
  query,
  toState,
}: {
  query: Pick<
    UseQueryResult<TData>,
    "data" | "isError" | "isPending" | "fetchStatus"
  >
  toState: (data: TData) => SourceState
}) => {
  if (query.data !== undefined) return SOURCE_STATES[toState(query.data)]

  if (isQueryUnavailable(query)) return "Its state can't be loaded right now."

  if (query.isError) return "Something went wrong while loading its state."

  return "Loading its state…"
}

function GoogleDriveSourceItem() {
  const googleConnectionQuery = useGoogleConnection()
  const state = describeSourceState({
    query: googleConnectionQuery,
    toState: function toGoogleConnectionState({ connection }) {
      return connection ? "set-up" : "google-not-connected"
    },
  })

  return (
    <ListItemLink
      to={ROUTES.INTEGRATION_GOOGLE}
      icon={<googleDrivePlugin.Icon />}
      primary={googleDrivePlugin.name}
      secondary={state}
    />
  )
}

function ConnectorSourceItem({
  type,
  connectorId,
  label,
}: {
  type: ConnectableConnectorType
  connectorId: string
  label: string
}) {
  const { Icon } = getPluginByType(type)
  const connectionQuery = useConnectorConnection({ connectorId })
  const state = describeSourceState({
    query: connectionQuery,
    toState: function toConnectorConnectionState(connection) {
      return connection
        ? CONNECTION_STATES[connection.status]
        : "connector-not-connected"
    },
  })

  return (
    <ListItemLink
      to={generatePath(ROUTES.INTEGRATION_CONNECTORS_EDIT, {
        type,
        id: connectorId,
      })}
      icon={<Icon />}
      primary={label}
      secondary={state}
    />
  )
}

function ConnectorSourceItems({ type }: { type: ConnectableConnectorType }) {
  const { Icon, name } = getPluginByType(type)
  const { data: connectors, isSuccess } = useConnectors({ type })

  if (!isSuccess) return null

  const hasConnectors = !!connectors?.length

  if (!hasConnectors) {
    return (
      <ListItemLink
        to={generatePath(ROUTES.INTEGRATION_CONNECTORS_NEW, { type })}
        icon={<Icon />}
        primary={name}
        secondary={SOURCE_STATES["no-connector"]}
      />
    )
  }

  return connectors.map((connector) => (
    <ConnectorSourceItem
      key={connector.id}
      type={type}
      connectorId={connector.id}
      label={toConnectorLabel(connector)}
    />
  ))
}

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
        <ListItemText secondary="Catalogs list the books of the sources that are set up. They leave out books under a protected tag or marked not interested." />
      </ListItem>
      {isGoogleDriveServed && <GoogleDriveSourceItem />}
      {SERVED_CONNECTOR_TYPES.map((type) => (
        <ConnectorSourceItems key={type} type={type} />
      ))}
      <UnservedSourcesItem unservedPlugins={unservedPlugins} />
    </PageSection>
  )
}
