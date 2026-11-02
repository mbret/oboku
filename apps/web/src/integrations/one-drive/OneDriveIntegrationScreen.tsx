import { DeleteRounded } from "@mui/icons-material"
import { IconButton, ListItem, ListItemText } from "@mui/material"
import { useSignalValue } from "reactjrx"
import {
  clearOneDriveSession,
  msalAccountSignal,
} from "./oneDrivePlugin/auth/auth"
import { Page } from "../../common/Page"
import { PageContainer } from "../../common/PageContainer"
import { PageSection } from "../../common/PageSection"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"

function getAccountLabel(account: { username?: string; name?: string }) {
  return account.username || account.name || "Connected OneDrive account"
}

export function OneDriveIntegrationScreen() {
  const account = useSignalValue(msalAccountSignal)

  return (
    <Page bottomGutter={false}>
      <TopBarNavigation title="OneDrive" showBack />
      <PageContainer disableGutters>
        <PageSection>
          <ListItem
            secondaryAction={
              account ? (
                <IconButton
                  edge="end"
                  aria-label="Clear OneDrive session"
                  onClick={function clearSession() {
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
                account
                  ? getAccountLabel(account)
                  : "No active OneDrive session"
              }
            />
          </ListItem>
        </PageSection>
      </PageContainer>
    </Page>
  )
}
