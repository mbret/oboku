import {
  Button,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
} from "@mui/material"
import type { ReactNode } from "react"
import { PageSection } from "../common/PageSection"
import { showConfirmDialog } from "../common/dialogs/presets"
import { ErrorAlert } from "../errors/ErrorMessage"
import { CancelError } from "../errors/errors.shared"

/**
 * What connecting does, then the last attempt's error and **Connect**. A
 * cancelled attempt (`CancelError`) shows no error.
 */
export function ConnectSection({
  title,
  children,
  error,
  isPending,
  connectLabel = "Connect",
  onConnect,
}: {
  title: string
  children: ReactNode
  error: unknown
  isPending: boolean
  connectLabel?: string
  onConnect: () => void
}) {
  const hasConnectionFailed = !!error && !(error instanceof CancelError)

  return (
    <PageSection title={title} variant="stack">
      {children}
      {hasConnectionFailed && <ErrorAlert error={error} />}
      <Stack sx={{ alignItems: "flex-start" }}>
        <Button variant="contained" loading={isPending} onClick={onConnect}>
          {connectLabel}
        </Button>
      </Stack>
    </PageSection>
  )
}

export function ConnectionLoadErrorSection({
  title,
  error,
}: {
  title: string
  error: unknown
}) {
  return (
    <PageSection title={title} variant="stack">
      <ErrorAlert error={error} />
    </PageSection>
  )
}

export function ConnectionDetailsSection({
  title,
  accountName,
  connectedAt,
}: {
  title: string
  accountName?: string
  connectedAt: string
}) {
  return (
    <PageSection title={title}>
      {accountName !== undefined && (
        <ListItem>
          <ListItemText primary="Connected as" secondary={accountName} />
        </ListItem>
      )}
      <ListItem>
        <ListItemText
          primary="Connected"
          secondary={new Date(connectedAt).toLocaleString()}
        />
      </ListItem>
    </PageSection>
  )
}

/** Asks with `confirmation` before it calls `onDisconnect`. */
export function DisconnectListItem({
  label,
  description,
  confirmation,
  onDisconnect,
}: {
  label: string
  description: string
  confirmation: { title: string; message: string }
  onDisconnect: () => void
}) {
  const confirmThenDisconnect = async () => {
    const confirmed = await showConfirmDialog({
      ...confirmation,
      actions: [{ title: "Disconnect" }],
    })

    if (!confirmed) return

    onDisconnect()
  }

  return (
    <ListItemButton onClick={confirmThenDisconnect}>
      <ListItemText primary={label} secondary={description} />
    </ListItemButton>
  )
}
