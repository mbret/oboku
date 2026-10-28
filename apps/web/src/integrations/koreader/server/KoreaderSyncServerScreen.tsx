import { memo } from "react"
import {
  Alert,
  Button,
  Link,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material"
import { Link as RouterLink } from "react-router"
import { ROUTES } from "../../../navigation/routes"
import { TopBarNavigation } from "../../../navigation/TopBarNavigation"
import { Page } from "../../../common/Page"
import { PageContainer } from "../../../common/PageContainer"
import { PageSection } from "../../../common/PageSection"
import { useConfig } from "../../../config/useConfig"
import { showConfirmDialog } from "../../../common/dialogs/presets"
import { CopyableField } from "../../../common/CopyableField"
import { IntroStack } from "../../../common/IntroStack"
import { GeneratedPasswordField } from "../../../common/GeneratedPasswordField"
import { useKoreaderSyncServer } from "./useKoreaderSyncServer"
import { useCreateKoreaderSyncServerPassword } from "./useCreateKoreaderSyncServerPassword"
import { useTurnOffKoreaderSyncServer } from "./useTurnOffKoreaderSyncServer"

const SETUP_STEPS = [
  "In KOReader, open Tools > Progress sync > Custom sync server and enter the server above.",
  "In the same Progress sync menu, tap Register / Login, enter the username and password above, then tap Login. Do not tap Register: the account already exists, it was created when you generated the password.",
  "Still in Progress sync, turn on Automatically keep documents in sync: KOReader then pulls the position when a book opens and pushes it as you read. It is off by default, and KOReader then syncs only when you tap Push progress from this device now or Pull progress from other devices now.",
  "Readest, CrossPoint and the other apps that support KOReader sync take the same three values in their KOReader sync settings.",
  "Devices recognize a book only when they identify it the same way: keep the same document matching method (binary by default) on all of them.",
]

export const KoreaderSyncServerScreen = memo(
  function KoreaderSyncServerScreen() {
    const { data: config } = useConfig()
    const { data: koreaderSyncServer } = useKoreaderSyncServer()
    const {
      mutate: createPassword,
      data: createdPassword,
      reset: forgetCreatedPassword,
      isPending: isCreatingPassword,
    } = useCreateKoreaderSyncServerPassword()
    const { mutate: turnOff } = useTurnOffKoreaderSyncServer()
    const passwordCreatedAt = koreaderSyncServer?.passwordCreatedAt
    const isEnabled = !!passwordCreatedAt

    const confirmThenCreatePassword = async () => {
      if (isEnabled) {
        const confirmed = await showConfirmDialog({
          title: "Generate a new password?",
          message:
            "Devices signed in with the current password stop syncing until you sign them in again with the new one.",
          actions: [{ title: "Generate" }],
        })

        if (!confirmed) return
      }

      createPassword()
    }

    const confirmThenTurnOff = async () => {
      const confirmed = await showConfirmDialog({
        title: "Turn off the KOReader sync server?",
        message:
          "Every device is signed out and the reading positions they synced are deleted.",
        actions: [{ title: "Turn off" }],
      })

      if (!confirmed) return

      turnOff(undefined, { onSuccess: forgetCreatedPassword })
    }

    return (
      <Page>
        <TopBarNavigation title="KOReader sync server" />
        <PageContainer>
          <IntroStack>
            <Typography>
              oboku can be the sync server of KOReader, Readest, CrossPoint and
              the other apps that support KOReader sync: point them at oboku and
              they sync their reading position with each other through it.
            </Typography>
            <Alert severity="info">
              To sync your reading in oboku with them too, turn on{" "}
              <Link component={RouterLink} to={ROUTES.KOREADER_PROGRESS_SYNC}>
                KOReader progress sync
              </Link>{" "}
              with this server.
            </Alert>
          </IntroStack>
        </PageContainer>
        <PageContainer disableGutters>
          <PageSection variant="stack">
            <CopyableField
              label="Server"
              value={config?.API_KOREADER_SYNC_SERVER_URL ?? ""}
            />
            <CopyableField
              label="Username"
              value={koreaderSyncServer?.username ?? ""}
            />
            {createdPassword ? (
              <GeneratedPasswordField password={createdPassword.password} />
            ) : (
              <Typography variant="body2" color="textSecondary">
                {passwordCreatedAt
                  ? `Password generated on ${new Date(passwordCreatedAt).toLocaleString()}. It cannot be shown again, generate a new one if you lost it.`
                  : "Generate a password to turn the server on."}
              </Typography>
            )}
            <Button
              variant="contained"
              loading={isCreatingPassword}
              onClick={confirmThenCreatePassword}
            >
              {isEnabled ? "Generate a new password" : "Generate a password"}
            </Button>
          </PageSection>
          <PageSection title="Set up a device">
            {SETUP_STEPS.map((step, index) => (
              <ListItem key={step}>
                <ListItemText primary={`${index + 1}. ${step}`} />
              </ListItem>
            ))}
          </PageSection>
          {isEnabled && (
            <PageSection title="Danger zone" tone="danger">
              <ListItemButton onClick={confirmThenTurnOff}>
                <ListItemText
                  primary="Turn off the KOReader sync server"
                  secondary="Signs every device out and deletes the reading positions they synced"
                />
              </ListItemButton>
            </PageSection>
          )}
        </PageContainer>
      </Page>
    )
  },
)
