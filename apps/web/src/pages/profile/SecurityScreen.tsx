import { memo, useState } from "react"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { ListItemButton, ListItemText } from "@mui/material"
import { useSettings } from "../../settings/useSettings"
import { SetupMasterPasswordDialog } from "../../secrets/SetupMasterPasswordDialog"
import { useRemoveMasterKey } from "../../secrets/useRemoveMasterKey"
import { PageContainer } from "../../common/PageContainer"
import { PageSection } from "../../common/PageSection"
import { Page } from "../../common/Page"

export const SecurityScreen = memo(function SecurityScreen() {
  const { data: accountSettings } = useSettings()
  const [
    isEditContentPasswordDialogOpened,
    setIsEditContentPasswordDialogOpened,
  ] = useState(false)
  const { mutate: removeMasterKey } = useRemoveMasterKey()

  return (
    <>
      <Page bottomGutter={false}>
        <TopBarNavigation title={"Security"} />
        <PageContainer disableGutters>
          <PageSection>
            <ListItemButton
              onClick={() => {
                setIsEditContentPasswordDialogOpened(true)
              }}
            >
              <ListItemText
                primary={
                  accountSettings?.masterEncryptionKey
                    ? "Change Master Password"
                    : "Initialize my Master Password"
                }
                secondary={
                  "This password is used to authorize sensitive actions, register secrets, etc."
                }
              />
            </ListItemButton>
          </PageSection>
          <PageSection title="Danger zone" tone="danger">
            {!!accountSettings?.masterEncryptionKey && (
              <ListItemButton
                onClick={() => {
                  removeMasterKey()
                }}
              >
                <ListItemText
                  primary="Remove Master Password"
                  secondary="Last resort if you really lost your password"
                />
              </ListItemButton>
            )}
          </PageSection>
        </PageContainer>
      </Page>
      <SetupMasterPasswordDialog
        open={isEditContentPasswordDialogOpened}
        onClose={() => setIsEditContentPasswordDialogOpened(false)}
      />
    </>
  )
})
