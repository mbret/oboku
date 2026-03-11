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
import { ConnectorInfoScreen } from "../../connectors/ConnectorInfoScreen"
import { useConnector } from "../../connectors/useConnector"
import {
  clearSynologyDriveSession,
  synologyDriveSessionSignal,
} from "./auth/auth"

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
              Expiration: Not provided by NAS (session valid until cleared or
              app refresh)
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
    <ConnectorInfoScreen connectorType="synology-drive" />
  </Box>
)
