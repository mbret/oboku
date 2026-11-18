import {
  BlockRounded,
  CheckCircleRounded,
  ErrorOutlineRounded,
  RadioButtonUncheckedRounded,
} from "@mui/icons-material"
import {
  CircularProgress,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import type { ConnectableConnectorType, DataSourceDocType } from "@oboku/shared"
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

type SourceState = "set-up" | "not-set-up" | "loading" | "unavailable"

const SOURCE_STATE_LABELS: Record<SourceState, string> = {
  "set-up": "Set up",
  "not-set-up": "Not set up",
  loading: "Loading its state",
  unavailable: "Its state could not load",
}

const toSourceState = <TData,>({
  query,
  isSetUp,
}: {
  query: Pick<
    UseQueryResult<TData>,
    "data" | "isError" | "isPending" | "fetchStatus"
  >
  isSetUp: (data: TData) => boolean
}): SourceState => {
  if (query.data !== undefined) {
    return isSetUp(query.data) ? "set-up" : "not-set-up"
  }

  if (isQueryUnavailable(query) || query.isError) return "unavailable"

  return "loading"
}

function SourceStateIcon({ state }: { state: SourceState }) {
  const label = SOURCE_STATE_LABELS[state]

  switch (state) {
    case "set-up":
      return <CheckCircleRounded color="success" titleAccess={label} />
    case "not-set-up":
      return <RadioButtonUncheckedRounded color="action" titleAccess={label} />
    case "loading":
      return <CircularProgress size={20} aria-label={label} />
    case "unavailable":
      return <ErrorOutlineRounded color="warning" titleAccess={label} />
  }
}

function GoogleDriveSourceItem() {
  const googleConnectionQuery = useGoogleConnection()
  const state = toSourceState({
    query: googleConnectionQuery,
    isSetUp: function isGoogleAccountConnected({ connection }) {
      return connection !== null
    },
  })

  return (
    <ListItemLink
      to={ROUTES.INTEGRATION_GOOGLE}
      icon={<googleDrivePlugin.Icon />}
      primary={googleDrivePlugin.name}
      end={<SourceStateIcon state={state} />}
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
  const state = toSourceState({
    query: connectionQuery,
    isSetUp: function isConnectorConnected(connection) {
      return connection?.status === "connected"
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
      end={<SourceStateIcon state={state} />}
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
        end={<SourceStateIcon state="not-set-up" />}
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
