import { BlockRounded } from "@mui/icons-material"
import { ListItem, ListItemIcon, ListItemText } from "@mui/material"
import {
  type ConnectableConnectorType,
  type ConnectorConnectionDto,
  isConnectableConnectorType,
  type SettingsConnectorDocType,
} from "@oboku/shared"
import type { UseQueryResult } from "@tanstack/react-query"
import { generatePath } from "react-router"
import { ListItemLink } from "../../../common/lists"
import { PageSection } from "../../../common/PageSection"
import { useConfig } from "../../../config/useConfig"
import { useConnectorConnection } from "../../../connectors/connection/useConnectorConnection"
import { useConnectors } from "../../../connectors/useConnectors"
import { ROUTES } from "../../../navigation/routes"
import { isQueryUnavailable } from "../../../queries/isQueryUnavailable"
import { useGoogleConnection } from "../../google/connection/useGoogleConnection"
import { type Plugin, plugins } from "../../plugins/configure"
import { useGetIsPluginVisible } from "../../plugins/useIsPluginEnabled"

const SET_UP_STATE = "Set up. Catalogs list its books."

const CONNECTION_STATES: Record<ConnectorConnectionDto["status"], string> = {
  connected: SET_UP_STATE,
  "connector-changed":
    "Waiting to set up. You changed this connector, so connect it again.",
}

/** A source's state from the query that holds it: its data first, then why it has none. */
const describeSourceState = <TData,>({
  query,
  describeData,
}: {
  query: Pick<
    UseQueryResult<TData>,
    "data" | "isError" | "isPending" | "fetchStatus"
  >
  describeData: (data: TData) => string
}) => {
  if (query.data !== undefined) return describeData(query.data)

  if (isQueryUnavailable(query)) return "Its state can't be loaded right now."

  if (query.isError) return "Something went wrong while loading its state."

  return "Loading its state…"
}

function GoogleDriveSourceItem({ plugin }: { plugin: Plugin }) {
  const googleConnectionQuery = useGoogleConnection()
  const state = describeSourceState({
    query: googleConnectionQuery,
    describeData: function describeGoogleConnection({ connection }) {
      return connection
        ? SET_UP_STATE
        : "Waiting to set up. Connect your Google account."
    },
  })

  return (
    <ListItemLink
      to={ROUTES.INTEGRATION_GOOGLE}
      icon={<plugin.Icon />}
      primary={plugin.name}
      secondary={state}
    />
  )
}

function ConnectorSourceItem({
  plugin,
  connector,
}: {
  plugin: Plugin
  connector: Pick<
    Extract<SettingsConnectorDocType, { type: ConnectableConnectorType }>,
    "id" | "type" | "url" | "username"
  >
}) {
  const connectionQuery = useConnectorConnection({ connectorId: connector.id })
  const state = describeSourceState({
    query: connectionQuery,
    describeData: function describeConnectorConnection(connection) {
      return connection
        ? CONNECTION_STATES[connection.status]
        : "Waiting to set up. Connect this connector."
    },
  })

  return (
    <ListItemLink
      to={generatePath(ROUTES.INTEGRATION_CONNECTORS_EDIT, {
        type: connector.type,
        id: connector.id,
      })}
      icon={<plugin.Icon />}
      primary={`${connector.url} (${connector.username})`}
      secondary={state}
    />
  )
}

function ConnectorSourceItems({
  plugin,
  type,
}: {
  plugin: Plugin
  type: ConnectableConnectorType
}) {
  const { data: connectors, isPending } = useConnectors({ type })

  if (isPending) return null

  const hasNoConnector = !connectors?.length

  if (hasNoConnector) {
    return (
      <ListItemLink
        to={generatePath(ROUTES.INTEGRATION_CONNECTORS_NEW, { type })}
        icon={<plugin.Icon />}
        primary={plugin.name}
        secondary="Waiting to set up. Add a connector, then connect it."
      />
    )
  }

  return connectors.map((connector) => (
    <ConnectorSourceItem
      key={connector.id}
      plugin={plugin}
      connector={connector}
    />
  ))
}

function ServedSourceItems({ plugin }: { plugin: Plugin }) {
  if (plugin.type === "DRIVE") return <GoogleDriveSourceItem plugin={plugin} />

  if (isConnectableConnectorType(plugin.type)) {
    return <ConnectorSourceItems plugin={plugin} type={plugin.type} />
  }

  return null
}

function UnservedSourcesItem({ plugins }: { plugins: Plugin[] }) {
  if (plugins.length === 0) return null

  const names = plugins
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

/**
 * The sources of books the catalogs can serve, each with its state, and one
 * line naming the kinds they cannot serve yet. Matches `isLinkServed` on the
 * API: Drive books need the Google connection, a connector's books its
 * connector connection.
 */
export function CatalogSourcesSection() {
  const { data: config } = useConfig()
  const isPluginVisible = useGetIsPluginVisible()
  const isGoogleConnectionEnabled = !!config?.FEATURE_GOOGLE_CONNECTION_ENABLED
  const visiblePlugins = plugins.filter((plugin) => isPluginVisible(plugin))
  const isServedByCatalogs = (plugin: Plugin) =>
    plugin.type === "DRIVE"
      ? isGoogleConnectionEnabled
      : isConnectableConnectorType(plugin.type)
  const servedPlugins = visiblePlugins.filter(isServedByCatalogs)
  const unservedPlugins = visiblePlugins.filter(
    (plugin) => !isServedByCatalogs(plugin),
  )

  return (
    <PageSection title="What catalogs list">
      <ListItem>
        <ListItemText secondary="Catalogs list the books of the sources set up here, except books under a protected tag or marked not interested." />
      </ListItem>
      {servedPlugins.map((plugin) => (
        <ServedSourceItems key={plugin.type} plugin={plugin} />
      ))}
      <UnservedSourcesItem plugins={unservedPlugins} />
    </PageSection>
  )
}
