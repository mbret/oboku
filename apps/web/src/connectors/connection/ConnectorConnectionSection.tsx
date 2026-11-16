import {
  Alert,
  Button,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material"
import type {
  ConnectableConnectorType,
  ConnectorConnectionDto,
} from "@oboku/shared"
import { PageSection } from "../../common/PageSection"
import { showConfirmDialog } from "../../common/dialogs/presets"
import { ErrorAlert } from "../../errors/ErrorMessage"
import { CancelError } from "../../errors/errors.shared"
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
  connection,
}: {
  connectorId: string
  connectorType: ConnectableConnectorType
  connection: ConnectorConnectionDto | null
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
  const hasConnectionFailed = !!error && !(error instanceof CancelError)
  const isConnectorChanged = connection?.status === "connector-changed"

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
    <PageSection title={SECTION_TITLE} variant="stack">
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
      {hasConnectionFailed && <ErrorAlert error={error} />}
      <Stack sx={{ alignItems: "flex-start" }}>
        <Button
          variant="contained"
          loading={isPending}
          onClick={confirmThenConnect}
        >
          {isConnectorChanged ? "Connect again" : "Connect"}
        </Button>
      </Stack>
    </PageSection>
  )
}

function ConnectedConnector({
  connection,
}: {
  connection: ConnectorConnectionDto
}) {
  return (
    <PageSection title={SECTION_TITLE}>
      <ListItem>
        <ListItemText
          primary="Connected"
          secondary={new Date(connection.connectedAt).toLocaleString()}
        />
      </ListItem>
    </PageSection>
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

  if (connection === undefined) {
    return (
      <PageSection title={SECTION_TITLE} variant="stack">
        <ErrorAlert error={error} />
      </PageSection>
    )
  }

  return connection?.status === "connected" ? (
    <ConnectedConnector connection={connection} />
  ) : (
    <ConnectConnector
      connectorId={connectorId}
      connectorType={connectorType}
      connection={connection}
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

  const confirmThenDisconnect = async () => {
    const confirmed = await showConfirmDialog({
      title: "Disconnect this connector?",
      message:
        "oboku's server forgets this connector's password, and your OPDS servers stop serving its books. The connector stays in your settings.",
      actions: [{ title: "Disconnect" }],
    })

    if (!confirmed) return

    disconnect({ profileId: activeProfileId, connectorId })
  }

  return (
    <ListItemButton onClick={confirmThenDisconnect}>
      <ListItemText
        primary="Disconnect this connector"
        secondary="oboku's server forgets its password"
      />
    </ListItemButton>
  )
}
