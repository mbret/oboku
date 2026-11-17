import { Alert, Stack, Typography } from "@mui/material"
import type { ConnectableConnectorType } from "@oboku/shared"
import { showConfirmDialog } from "../../common/dialogs/presets"
import {
  ConnectSection,
  ConnectionDetailsSection,
  ConnectionLoadErrorSection,
  DisconnectListItem,
} from "../../connections/ConnectionSections"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { useConnectConnector } from "./useConnectConnector"
import { useConnectorConnection } from "./useConnectorConnection"
import { useDisconnectConnector } from "./useDisconnectConnector"

const SECTION_TITLE = "Connection"

function ConnectConsentMessage() {
  return (
    <Stack spacing={1.5}>
      <Typography color="text.secondary">
        oboku's server will keep this connector's password, so that your OPDS
        servers can serve its books. The server stores it encrypted, but unlike
        your other secrets, the server can read it.
      </Typography>
      <Typography color="text.secondary">
        The server sends the password only to this connector's address. If you
        edit the connector or its password, the server stops using it until you
        connect again.
      </Typography>
      <Typography color="text.secondary">
        To make the server forget the password, disconnect the connector.
      </Typography>
    </Stack>
  )
}

function ConnectConnector({
  connectorId,
  connectorType,
  isConnectorChanged,
}: {
  connectorId: string
  connectorType: ConnectableConnectorType
  isConnectorChanged: boolean
}) {
  const activeProfileId = useActiveProfileId()
  const {
    mutate: connect,
    error,
    isPending,
  } = useConnectConnector(
    { type: connectorType },
    { meta: { suppressGlobalErrorToast: true } },
  )

  const confirmThenConnect = async () => {
    const confirmed = await showConfirmDialog({
      title: "Connect this connector?",
      message: <ConnectConsentMessage />,
      actions: [{ title: "Connect" }],
    })

    if (!confirmed) return

    connect({ profileId: activeProfileId, connectorId })
  }

  return (
    <ConnectSection
      title={SECTION_TITLE}
      error={error}
      isPending={isPending}
      connectLabel={isConnectorChanged ? "Connect again" : "Connect"}
      onConnect={confirmThenConnect}
    >
      {isConnectorChanged ? (
        <Alert severity="warning">
          You changed this connector or its password after you connected it.
          oboku's server stopped using the password it keeps. Connect again to
          use the new settings.
        </Alert>
      ) : (
        <Typography>
          Connect this connector to let oboku's server keep its password, so
          that your OPDS servers can serve its books without this browser.
        </Typography>
      )}
    </ConnectSection>
  )
}

export function ConnectorConnectionSection({
  connectorId,
  connectorType,
}: {
  connectorId: string
  connectorType: ConnectableConnectorType
}) {
  const {
    data: connection,
    error,
    isPending,
  } = useConnectorConnection({
    connectorId,
  })

  if (isPending) return null

  const hasConnectionsLoaded = connection !== undefined

  if (!hasConnectionsLoaded) {
    return <ConnectionLoadErrorSection title={SECTION_TITLE} error={error} />
  }

  return connection?.status === "connected" ? (
    <ConnectionDetailsSection
      title={SECTION_TITLE}
      connectedAt={connection.connectedAt}
    />
  ) : (
    <ConnectConnector
      connectorId={connectorId}
      connectorType={connectorType}
      isConnectorChanged={connection?.status === "connector-changed"}
    />
  )
}

export function DisconnectConnectorListItem({
  connectorId,
}: {
  connectorId: string
}) {
  const activeProfileId = useActiveProfileId()
  const { data: connection } = useConnectorConnection({ connectorId })
  const { mutate: disconnect } = useDisconnectConnector()

  if (!connection) return null

  return (
    <DisconnectListItem
      label="Disconnect this connector"
      description="oboku's server forgets its password"
      confirmation={{
        title: "Disconnect this connector?",
        message:
          "oboku's server forgets this connector's password, and your OPDS servers stop serving its books. The connector stays in your settings.",
      }}
      onDisconnect={function disconnectConnector() {
        disconnect({ profileId: activeProfileId, connectorId })
      }}
    />
  )
}
