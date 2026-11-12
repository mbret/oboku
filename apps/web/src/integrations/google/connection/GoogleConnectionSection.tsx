import {
  Button,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material"
import type { GoogleConnectionDto } from "@oboku/shared"
import { PageSection } from "../../../common/PageSection"
import { showConfirmDialog } from "../../../common/dialogs/presets"
import { useConfig } from "../../../config/useConfig"
import { ErrorAlert } from "../../../errors/ErrorMessage"
import { CancelError } from "../../../errors/errors.shared"
import { useActiveProfileId } from "../../../profiles/active/activeProfileId"
import { useConnectGoogleAccount } from "./useConnectGoogleAccount"
import { useDisconnectGoogleAccount } from "./useDisconnectGoogleAccount"
import { useGoogleConnection } from "./useGoogleConnection"

const SECTION_TITLE = "Google account"

function ConnectGoogleAccount() {
  const activeProfileId = useActiveProfileId()
  const {
    mutate: connect,
    error,
    isPending,
  } = useConnectGoogleAccount({ meta: { suppressGlobalErrorToast: true } })
  const hasConnectionFailed = !!error && !(error instanceof CancelError)

  return (
    <PageSection title={SECTION_TITLE} variant="stack">
      <Typography>
        Connect your Google account to let oboku's server keep access to the
        Google Drive books you added, so that it can reach them without this
        browser. It reaches only the files you picked or opened with oboku,
        never the rest of your Drive.
      </Typography>
      <Typography color="text.secondary">
        While connected, oboku stops opening Google's sign-in window whenever it
        needs your Drive.
      </Typography>
      {hasConnectionFailed && <ErrorAlert error={error} />}
      <Stack sx={{ alignItems: "flex-start" }}>
        <Button
          variant="contained"
          loading={isPending}
          onClick={function connectGoogleAccount() {
            connect({ profileId: activeProfileId })
          }}
        >
          Connect
        </Button>
      </Stack>
    </PageSection>
  )
}

function ConnectedGoogleAccount({
  connection,
}: {
  connection: GoogleConnectionDto
}) {
  const activeProfileId = useActiveProfileId()
  const { mutate: disconnect } = useDisconnectGoogleAccount()

  const confirmThenDisconnect = async () => {
    const confirmed = await showConfirmDialog({
      title: "Disconnect your Google account?",
      message:
        "oboku's server forgets its access to your Drive, and your books stay in your library. To connect again later, first remove oboku from the third-party apps of your Google Account.",
      actions: [{ title: "Disconnect" }],
    })

    if (!confirmed) return

    disconnect({ profileId: activeProfileId })
  }

  return (
    <>
      <PageSection title={SECTION_TITLE}>
        <ListItem>
          <ListItemText
            primary="Connected as"
            secondary={connection.accountName}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Connected"
            secondary={new Date(connection.connectedAt).toLocaleString()}
          />
        </ListItem>
      </PageSection>
      <PageSection title="Danger zone" tone="danger">
        <ListItemButton onClick={confirmThenDisconnect}>
          <ListItemText
            primary="Disconnect your Google account"
            secondary="oboku's server forgets its access to your Drive"
          />
        </ListItemButton>
      </PageSection>
    </>
  )
}

function GoogleConnection() {
  const { data, error, isPending } = useGoogleConnection()

  if (isPending) return null

  if (!data) {
    return (
      <PageSection title={SECTION_TITLE} variant="stack">
        <ErrorAlert error={error} />
      </PageSection>
    )
  }

  const { connection } = data

  return connection ? (
    <ConnectedGoogleAccount connection={connection} />
  ) : (
    <ConnectGoogleAccount />
  )
}

export function GoogleConnectionSection() {
  const { data: config } = useConfig()

  if (!config?.FEATURE_GOOGLE_CONNECTION_ENABLED) return null

  return <GoogleConnection />
}
