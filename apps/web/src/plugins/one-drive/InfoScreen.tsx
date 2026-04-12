import { DeleteRounded } from "@mui/icons-material"
import { IconButton, List, ListItem, ListItemText, Stack } from "@mui/material"
import { useSignalValue } from "reactjrx"
import { clearOneDriveSession, msalAccountSignal } from "./auth/auth"

function getAccountLabel(account: { username?: string; name?: string }) {
  return account.username || account.name || "Connected OneDrive account"
}

export function InfoScreen() {
  const account = useSignalValue(msalAccountSignal)

  return (
    <Stack>
      <List>
        <ListItem
          secondaryAction={
            account ? (
              <IconButton
                edge="end"
                aria-label="Clear OneDrive session"
                onClick={() => {
                  void clearOneDriveSession()
                }}
              >
                <DeleteRounded />
              </IconButton>
            ) : undefined
          }
        >
          <ListItemText
            primary="Current session"
            secondary={
              account ? getAccountLabel(account) : "No active OneDrive session"
            }
          />
        </ListItem>
      </List>
    </Stack>
  )
}
