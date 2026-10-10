import { memo } from "react"
import {
  Alert,
  Button,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Stack,
  styled,
  TextField,
  Typography,
} from "@mui/material"
import { ContentCopyRounded } from "@mui/icons-material"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { Page } from "../../common/Page"
import { useConfig } from "../../config/useConfig"
import { showConfirmDialog } from "../../common/dialogs/presets"
import { notify } from "../../notifications/toasts"
import { useKoreaderSyncServer } from "../../koreaderSyncServer/useKoreaderSyncServer"
import { useCreateKoreaderSyncServerPassword } from "../../koreaderSyncServer/useCreateKoreaderSyncServerPassword"
import { useTurnOffKoreaderSyncServer } from "../../koreaderSyncServer/useTurnOffKoreaderSyncServer"

const DetailsStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}))

const SETUP_STEPS = [
  "In KOReader, open Tools > Progress sync > Custom sync server and enter the server above.",
  "In the same Progress sync menu, tap Register / Login, enter the username and password above, then tap Login. Do not tap Register: the account already exists, it was created when you generated the password.",
  "Still in Progress sync, turn on Automatically keep documents in sync: KOReader then pulls the position when a book opens and pushes it as you read. It is off by default, and KOReader then syncs only when you tap Push progress from this device now or Pull progress from other devices now.",
  "Readest, Crosspoint and the other apps that support KOReader sync take the same three values in their KOReader sync settings.",
  "Devices recognize a book only when they identify it the same way: keep the same document matching method (binary by default) on all of them.",
]

const CopyableField = memo(function CopyableField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  const copyValueToClipboard = async () => {
    await navigator.clipboard.writeText(value)

    notify({
      title: "Copied",
      description: `${label} copied to the clipboard`,
      severity: "success",
    })
  }

  return (
    <TextField
      label={label}
      value={value}
      fullWidth
      slotProps={{
        input: {
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                onClick={copyValueToClipboard}
                aria-label={`Copy ${label.toLowerCase()}`}
              >
                <ContentCopyRounded fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  )
})

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
        <Container maxWidth="sm">
          <DetailsStack>
            <Typography>
              oboku can be the sync server of KOReader, Readest, Crosspoint and
              the other apps that support KOReader sync: point them at oboku and
              they sync their reading position with each other through it.
            </Typography>
            <Alert severity="info">
              This does not sync your reading in oboku itself: only the apps you
              point at this server sync with each other.
            </Alert>
            <CopyableField
              label="Server"
              value={config?.API_KOREADER_SYNC_SERVER_URL ?? ""}
            />
            <CopyableField
              label="Username"
              value={koreaderSyncServer?.username ?? ""}
            />
            {createdPassword ? (
              <>
                <CopyableField
                  label="Password"
                  value={createdPassword.password}
                />
                <Alert severity="warning">
                  Copy this password now: it is not shown again.
                </Alert>
              </>
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
            <List
              disablePadding
              subheader={
                <ListSubheader disableGutters disableSticky>
                  Set up a device
                </ListSubheader>
              }
            >
              {SETUP_STEPS.map((step, index) => (
                <ListItem key={step} disableGutters>
                  <ListItemText primary={`${index + 1}. ${step}`} />
                </ListItem>
              ))}
            </List>
            {isEnabled && (
              <>
                <Divider />
                <Button
                  variant="outlined"
                  color="error"
                  onClick={confirmThenTurnOff}
                >
                  Turn off the KOReader sync server
                </Button>
              </>
            )}
          </DetailsStack>
        </Container>
      </Page>
    )
  },
)
