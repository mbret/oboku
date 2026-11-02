import {
  Button,
  capitalize,
  IconButton,
  ListItem,
  ListItemText,
  Stack,
} from "@mui/material"
import { useSignalValue } from "reactjrx"
import { gapiSignal, useLoadGapi } from "./googleDrivePlugin/lib/gapi"
import { gsiSignal } from "./gsi"
import {
  clearGoogleAccessToken,
  googleAccessTokenSignal,
  getTokenExpirationDate,
} from "./auth"
import { DeleteRounded } from "@mui/icons-material"
import { Page } from "../../common/Page"
import { PageContainer } from "../../common/PageContainer"
import { PageSection } from "../../common/PageSection"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"

export function GoogleIntegrationScreen() {
  const gapi = useSignalValue(gapiSignal)
  const gsi = useSignalValue(gsiSignal)
  const accessToken = useSignalValue(googleAccessTokenSignal)
  const { mutate } = useLoadGapi()

  const createdAtDate = accessToken
    ? new Date(accessToken.created_at)
    : undefined

  return (
    <Page bottomGutter={false}>
      <TopBarNavigation title="Google" showBack />
      <PageContainer disableGutters>
        <Stack>
          <PageSection>
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
                    onClick={clearGoogleAccessToken}
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
          </PageSection>
          <Stack
            sx={{
              px: 2,
              alignItems: "flex-start",
            }}
          >
            <Button
              onClick={function forceReloadGoogleApiScript() {
                mutate()
              }}
              disabled={!!gapi.gapi}
            >
              Force reload Google API script
            </Button>
          </Stack>
        </Stack>
      </PageContainer>
    </Page>
  )
}
