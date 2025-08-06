import {
  Button,
  capitalize,
  List,
  ListItem,
  ListItemText,
  Stack,
} from "@mui/material"
import { useSignalValue } from "reactjrx"
import { gapiSignal, useLoadGapi } from "./lib/gapi"
import { gsiSignal } from "../../google/gsi"
import { accessTokenSignal, getTokenExpirationDate } from "../../google/auth"

export const InfoScreen = () => {
  const gapi = useSignalValue(gapiSignal)
  const gsi = useSignalValue(gsiSignal)
  const accessToken = useSignalValue(accessTokenSignal)
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
        <ListItem>
          <ListItemText
            primary="Auth token"
            secondary={
              createdAtDate && accessToken
                ? `Created at ${createdAtDate.toLocaleString()} and expires at ${getTokenExpirationDate(accessToken).toLocaleString()}`
                : "Not yet created"
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
