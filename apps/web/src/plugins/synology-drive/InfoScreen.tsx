import { DeleteRounded } from "@mui/icons-material"
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material"
import { useSignalValue } from "reactjrx"
import { ConnectorInfoSection } from "../../connectors/ConnectorInfoSection"
import { useConnector } from "../../connectors/useConnector"
import {
  SYNOLOGY_DRIVE_SESSION_MAX_AGE_MS,
  clearSynologyDriveSession,
  synologyDriveSessionSignal,
} from "./auth/auth"

const SESSION_MAX_AGE_MINUTES = SYNOLOGY_DRIVE_SESSION_MAX_AGE_MS / (60 * 1000)

const CurrentSessionSection = () => {
  const session = useSignalValue(synologyDriveSessionSignal)
  const { data: connector } = useConnector({
    id: session?.connectorId,
    type: "synology-drive",
  })

  if (!session) {
    return (
      <ListItem>
        <ListItemText
          primary="No active session"
          secondary="A session is created when you use a connector (e.g. upload or browse)."
        />
      </ListItem>
    )
  }

  const createdAt = session.createdAt
    ? new Date(session.createdAt).toLocaleString()
    : "—"
  const primary = `${connector?.url ?? session.auth.baseUrl} (${connector?.username ?? session.auth.username}@********)`

  return (
    <ListItem
      secondaryAction={
        <IconButton
          edge="end"
          aria-label="Clear session"
          onClick={() => {
            clearSynologyDriveSession()
          }}
        >
          <DeleteRounded />
        </IconButton>
      }
    >
      <ListItemText
        primary={primary}
        secondary={
          <Stack component="span" spacing={0.5}>
            <Typography component="span" variant="body2" display="block">
              Created at: {createdAt}
            </Typography>
            <Typography component="span" variant="body2" display="block">
              Expiration: Refreshed after {SESSION_MAX_AGE_MINUTES} minutes or
              sooner if the NAS rejects the session
            </Typography>
          </Stack>
        }
      />
    </ListItem>
  )
}

export const InfoScreen = () => (
  <Box display="flex" flexDirection="column" flex={1}>
    <Stack sx={{ px: 2, pt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Current session
      </Typography>
      <List disablePadding>
        <CurrentSessionSection />
      </List>
    </Stack>
    <ConnectorInfoSection connectorType="synology-drive" />
  </Box>
)
