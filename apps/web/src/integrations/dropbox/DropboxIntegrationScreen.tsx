import { Alert, IconButton, ListItem, ListItemText, Stack } from "@mui/material"
import { SIGNAL_RESET, useSignalValue } from "reactjrx"
import { DeleteRounded } from "@mui/icons-material"
import { dropboxAuthSignal } from "./dropboxPlugin/lib/auth"
import { useEffect, useState } from "react"
import { Page } from "../../common/Page"
import { PageContainer } from "../../common/PageContainer"
import { PageSection } from "../../common/PageSection"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"

export function DropboxIntegrationScreen() {
  const dropboxAuth = useSignalValue(dropboxAuthSignal)
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined)
  const [accessTokenExpiresAt, setAccessTokenExpiresAt] = useState<
    Date | undefined
  >(undefined)

  useEffect(
    function checkAccessToken() {
      const updateToken = () => {
        setAccessToken(dropboxAuth?.getAccessToken())
        setAccessTokenExpiresAt(dropboxAuth?.getAccessTokenExpiresAt())
      }

      const tl = setInterval(updateToken, 1000)

      updateToken()

      return function stopCheckingAccessToken() {
        clearInterval(tl)
      }
    },
    [dropboxAuth],
  )

  return (
    <Page bottomGutter={false}>
      <TopBarNavigation title="Dropbox" showBack />
      <PageContainer disableGutters>
        <Stack>
          <Alert severity="warning" sx={{ mx: 2, mt: 2 }}>
            Due to Dropbox API limitations, the picker authentication will not
            be reset when switching accounts.
          </Alert>
          <PageSection>
            <ListItem
              secondaryAction={
                !accessToken ? undefined : (
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={function clearDropboxAuth() {
                      dropboxAuthSignal.update(SIGNAL_RESET)
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
                  accessTokenExpiresAt && accessToken
                    ? `Expires at ${accessTokenExpiresAt.toLocaleString()}`
                    : "No access token active"
                }
              />
            </ListItem>
          </PageSection>
        </Stack>
      </PageContainer>
    </Page>
  )
}
