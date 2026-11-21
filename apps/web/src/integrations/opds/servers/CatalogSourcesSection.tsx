import { BlockRounded } from "@mui/icons-material"
import { ListItem, ListItemIcon, ListItemText } from "@mui/material"
import {
  type DataSourceDocType,
  OPDS_SERVED_CONNECTOR_TYPES,
} from "@oboku/shared"
import type { UseQueryResult } from "@tanstack/react-query"
import { generatePath } from "react-router"
import { ListItemLink } from "../../../common/lists"
import { PageSection } from "../../../common/PageSection"
import { useConfig } from "../../../config/useConfig"
import { useConnectorConnections } from "../../../connectors/connection/useConnectorConnections"
import {
  CONNECTOR_DETAILS,
  toConnectorLabel,
} from "../../../connectors/connectorDetails"
import { ROUTES } from "../../../navigation/routes"
import { isQueryUnavailable } from "../../../queries/isQueryUnavailable"
import { useSettings } from "../../../settings/useSettings"
import { useGoogleConnection } from "../../google/connection/useGoogleConnection"
import { plugin as googleDrivePlugin } from "../../google/googleDrivePlugin"
import { getPluginByType, type Plugin, plugins } from "../../plugins/configure"
import { useGetIsPluginVisible } from "../../plugins/useIsPluginEnabled"

const isServedConnectorType = (type: string) =>
  OPDS_SERVED_CONNECTOR_TYPES.some((servedType) => servedType === type)

type QueryState = Pick<
  UseQueryResult,
  "data" | "isError" | "isPending" | "fetchStatus"
>

const toQueriesState = (queries: QueryState[]) => {
  const isEveryQueryLoaded = queries.every((query) => query.data !== undefined)

  if (isEveryQueryLoaded) return "loaded"

  const isAnyQueryUnavailable = queries.some(
    (query) => query.isError || isQueryUnavailable(query),
  )

  return isAnyQueryUnavailable ? "unavailable" : "loading"
}

type SetUpSource = {
  key: string
  to: string
  plugin: Plugin
  detail: string
}

function NoteItem({ text }: { text: string }) {
  return (
    <ListItem>
      <ListItemText secondary={text} />
    </ListItem>
  )
}

function SetUpSourcesSection({
  isGoogleDriveServed,
}: {
  isGoogleDriveServed: boolean
}) {
  const googleConnectionQuery = useGoogleConnection({
    enabled: isGoogleDriveServed,
  })
  const connectorConnectionsQuery = useConnectorConnections()
  const settingsQuery = useSettings()
  const queriesState = toQueriesState(
    isGoogleDriveServed
      ? [googleConnectionQuery, connectorConnectionsQuery, settingsQuery]
      : [connectorConnectionsQuery, settingsQuery],
  )
  const googleConnection = isGoogleDriveServed
    ? googleConnectionQuery.data?.connection
    : null
  const connectedConnectorIds = new Set(
    connectorConnectionsQuery.data?.connections
      .filter(({ status }) => status === "connected")
      .map(({ connectorId }) => connectorId),
  )
  const connectedConnectors =
    settingsQuery.data?.connectors?.filter(
      function isConnectedServedConnector(connector) {
        return (
          isServedConnectorType(connector.type) &&
          connectedConnectorIds.has(connector.id)
        )
      },
    ) ?? []
  const setUpSources: SetUpSource[] = [
    ...(googleConnection
      ? [
          {
            key: "google",
            to: ROUTES.INTEGRATION_GOOGLE,
            plugin: googleDrivePlugin,
            detail: googleConnection.accountName,
          },
        ]
      : []),
    ...connectedConnectors.map(function toSetUpConnector(connector) {
      return {
        key: connector.id,
        to: generatePath(ROUTES.INTEGRATION_CONNECTORS_EDIT, {
          type: connector.type,
          id: connector.id,
        }),
        plugin: getPluginByType(connector.type),
        detail: toConnectorLabel(connector),
      }
    }),
  ]
  const isNothingSetUp = queriesState === "loaded" && setUpSources.length === 0

  return (
    <PageSection title="Sources set up">
      <NoteItem text="Catalogs list the books of these sources. They leave out books under a protected tag or marked not interested." />
      {queriesState === "loading" && (
        <NoteItem text="Loading the sources set up…" />
      )}
      {queriesState === "unavailable" && (
        <NoteItem text="The sources set up can't be loaded right now." />
      )}
      {isNothingSetUp && (
        <NoteItem text="Nothing set up yet. Add a source below." />
      )}
      {queriesState === "loaded" &&
        setUpSources.map(function toSetUpSourceItem({
          key,
          to,
          plugin,
          detail,
        }) {
          return (
            <ListItemLink
              key={key}
              to={to}
              icon={<plugin.Icon />}
              primary={plugin.name}
              secondary={detail}
            />
          )
        })}
    </PageSection>
  )
}

function AvailableSourcesSection({
  isGoogleDriveServed,
}: {
  isGoogleDriveServed: boolean
}) {
  return (
    <PageSection title="Sources available">
      {isGoogleDriveServed && (
        <ListItemLink
          to={ROUTES.INTEGRATION_GOOGLE}
          icon={<googleDrivePlugin.Icon />}
          primary={googleDrivePlugin.name}
        />
      )}
      {OPDS_SERVED_CONNECTOR_TYPES.map(
        function toServedConnectorTypeItem(type) {
          const { Icon, name } = getPluginByType(type)

          return (
            <ListItemLink
              key={type}
              to={CONNECTOR_DETAILS[type].integrationRoute}
              icon={<Icon />}
              primary={name}
            />
          )
        },
      )}
    </PageSection>
  )
}

function UnservedSourcesSection({
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
    <PageSection title="Sources not available yet">
      <ListItem>
        <ListItemIcon>
          <BlockRounded />
        </ListItemIcon>
        <ListItemText primary={names} />
      </ListItem>
    </PageSection>
  )
}

export function CatalogSourcesSection() {
  const { data: config } = useConfig()
  const isPluginVisible = useGetIsPluginVisible()
  const isGoogleDriveServed = !!config?.FEATURE_GOOGLE_CONNECTION_ENABLED
  const servedTypes: ReadonlyArray<DataSourceDocType["type"]> =
    isGoogleDriveServed
      ? [googleDrivePlugin.type, ...OPDS_SERVED_CONNECTOR_TYPES]
      : OPDS_SERVED_CONNECTOR_TYPES
  const unservedPlugins = plugins.filter(
    (plugin) => isPluginVisible(plugin) && !servedTypes.includes(plugin.type),
  )

  return (
    <>
      <SetUpSourcesSection isGoogleDriveServed={isGoogleDriveServed} />
      <AvailableSourcesSection isGoogleDriveServed={isGoogleDriveServed} />
      <UnservedSourcesSection unservedPlugins={unservedPlugins} />
    </>
  )
}
