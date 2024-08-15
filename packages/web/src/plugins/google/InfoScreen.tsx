import { capitalize, List, ListItem, ListItemText } from "@mui/material"
import { useSignalValue } from "reactjrx"
import { gapiSignal } from "./lib/gapi"
import { gsiSignal } from "./lib/gsi"
import { accessTokenSignal, getTokenExpirationDate } from "./lib/auth"

export const InfoScreen = () => {
  const gapi = useSignalValue(gapiSignal)
  const gsi = useSignalValue(gsiSignal)
  const accessToken = useSignalValue(accessTokenSignal)

  const createdAtDate = accessToken
    ? new Date(accessToken.created_at)
    : undefined

  return (
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
  )
}
