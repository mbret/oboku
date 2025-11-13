import {
  Button,
  capitalize,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
} from "@mui/material"
import { SIGNAL_RESET, useSignalValue } from "reactjrx"
import { gapiSignal, useLoadGapi } from "./lib/gapi"
import { gsiSignal } from "../../google/gsi"
import {
  googleAccessTokenSignal,
  getTokenExpirationDate,
} from "../../google/auth"
import { DeleteRounded } from "@mui/icons-material"

export const InfoScreen = () => {
  const gapi = useSignalValue(gapiSignal)
  const gsi = useSignalValue(gsiSignal)
  const accessToken = useSignalValue(googleAccessTokenSignal)
  const { mutate } = useLoadGapi()

  const createdAtDate = accessToken
    ? new Date(accessToken.created_at)
    : undefined

  return (
    <Stack>
      <List>
        <ListItem>
          <ListItemText
            primary="Google API"
            secondary={`${capitalize(gapi.state)}. ${gapi.error ? `Error: ${gapi.error}` : ``}`}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Google GSI API"
            secondary={`${capitalize(gsi.state)}.`}
          />
        </ListItem>
        <ListItem
          secondaryAction={
            !accessToken ? undefined : (
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => {
                  googleAccessTokenSignal.update(SIGNAL_RESET)
                }}
              >
                <DeleteRounded />
              </IconButton>
            )
          }
        >
          <ListItemText
            primary="Auth token"
            secondary={
              createdAtDate && accessToken
                ? `Created at ${createdAtDate.toLocaleString()} and expires at ${getTokenExpirationDate(accessToken).toLocaleString()}`
                : "No access token active"
            }
          />
        </ListItem>
      </List>
      <Stack px={2} alignItems="flex-start">
        <Button onClick={() => mutate()} disabled={!!gapi.gapi}>
          Force reload Google API script
        </Button>
      </Stack>
    </Stack>
  )
}
