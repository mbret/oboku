import { memo } from "react"
import {
  Alert,
  alpha,
  Button,
  Container,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
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
import { useKoreaderSync } from "../../koreaderSync/useKoreaderSync"
import { useCreateKoreaderSyncPassword } from "../../koreaderSync/useCreateKoreaderSyncPassword"
import { useTurnOffKoreaderSync } from "../../koreaderSync/useTurnOffKoreaderSync"

const DetailsStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}))

const DangerZoneList = styled(List)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.error.light, 0.2),
}))

const DangerZoneListSubheader = styled(ListSubheader)(({ theme }) => ({
  color: theme.palette.error.dark,
}))

const SETUP_STEPS = [
  "In KOReader, open Tools > Progress sync > Custom sync server and enter the server above.",
  "Still in Progress sync, choose Register / Login, then Login with the username and password above. There is no need to register.",
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

export const KoreaderSyncScreen = memo(function KoreaderSyncScreen() {
  const { data: config } = useConfig()
  const { data: koreaderSync } = useKoreaderSync()
  const {
    mutate: createPassword,
    data: createdPassword,
    reset: forgetCreatedPassword,
    isPending: isCreatingPassword,
  } = useCreateKoreaderSyncPassword()
  const { mutate: turnOff } = useTurnOffKoreaderSync()
  const passwordCreatedAt = koreaderSync?.passwordCreatedAt
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
      title: "Turn off KOReader sync?",
      message:
        "Every device is signed out and the reading positions they synced are deleted.",
      actions: [{ title: "Turn off" }],
    })

    if (!confirmed) return

    forgetCreatedPassword()
    turnOff()
  }

  return (
    <Page>
      <TopBarNavigation title="KOReader sync" />
      <Container maxWidth="sm">
        <DetailsStack>
          <Typography>
            Use oboku as the sync server of KOReader, Readest, Crosspoint and
            the other apps that support KOReader sync, so your reading position
            follows you from one device to the next.
          </Typography>
          <CopyableField
            label="Server"
            value={config?.API_KOREADER_SYNC_URL ?? ""}
          />
          <CopyableField
            label="Username"
            value={koreaderSync?.username ?? ""}
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
                : "Generate a password to turn KOReader sync on."}
            </Typography>
          )}
          <Button
            variant="contained"
            loading={isCreatingPassword}
            onClick={confirmThenCreatePassword}
          >
            {isEnabled ? "Generate a new password" : "Generate a password"}
          </Button>
        </DetailsStack>
      </Container>
      <List
        subheader={<ListSubheader disableSticky>Set up a device</ListSubheader>}
      >
        {SETUP_STEPS.map((step, index) => (
          <ListItem key={step}>
            <ListItemText primary={`${index + 1}. ${step}`} />
          </ListItem>
        ))}
      </List>
      {isEnabled && (
        <DangerZoneList
          subheader={
            <DangerZoneListSubheader disableSticky>
              Danger zone
            </DangerZoneListSubheader>
          }
        >
          <ListItemButton onClick={confirmThenTurnOff}>
            <ListItemText
              primary="Turn off KOReader sync"
              secondary="Signs every device out and deletes the reading positions they synced"
            />
          </ListItemButton>
        </DangerZoneList>
      )}
    </Page>
  )
})
