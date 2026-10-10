import { memo } from "react"
import {
  Alert,
  Button,
  Link,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material"
import type { KoreaderSyncConnection } from "@oboku/shared"
import { useForm } from "react-hook-form"
import { Link as RouterLink } from "react-router"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { ROUTES } from "../../navigation/routes"
import { Page } from "../../common/Page"
import { PageContainer } from "../../common/PageContainer"
import { PageSection } from "../../common/PageSection"
import { ControlledTextField } from "../../common/forms/ControlledTextField"
import { showConfirmDialog } from "../../common/dialogs/presets"
import { ErrorAlert } from "../../errors/ErrorMessage"
import { useConfig } from "../../config/useConfig"
import { useKoreaderSyncServer } from "../../koreaderSyncServer/useKoreaderSyncServer"
import { useKoreaderSyncConnection } from "../../koreaderSyncConnection/useKoreaderSyncConnection"
import { useConnectKoreaderSyncServer } from "../../koreaderSyncConnection/useConnectKoreaderSyncServer"
import { useDisconnectKoreaderSyncServer } from "../../koreaderSyncConnection/useDisconnectKoreaderSyncServer"

type ConnectionFormValues = {
  serverUrl: string
  username: string
  password: string
}

const isHttpUrl = (value: string) =>
  URL.canParse(value) && ["http:", "https:"].includes(new URL(value).protocol)

const ObokuSyncServerShortcut = memo(function ObokuSyncServerShortcut({
  onUse,
}: {
  onUse: (values: Pick<ConnectionFormValues, "serverUrl" | "username">) => void
}) {
  const { data: config } = useConfig()
  const { data: koreaderSyncServer } = useKoreaderSyncServer()
  const isObokuSyncServerOn = !!koreaderSyncServer?.passwordCreatedAt

  if (!isObokuSyncServerOn) {
    return (
      <Alert severity="info">
        To sync with the KOReader devices that use oboku as their server, turn
        on the{" "}
        <Link component={RouterLink} to={ROUTES.KOREADER_SYNC_SERVER}>
          KOReader sync server
        </Link>{" "}
        first.
      </Alert>
    )
  }

  return (
    <Alert
      severity="info"
      action={
        <Button
          color="inherit"
          size="small"
          sx={{ whiteSpace: "nowrap" }}
          onClick={function applyObokuSyncServer() {
            onUse({
              serverUrl: config?.API_KOREADER_SYNC_SERVER_URL ?? "",
              username: koreaderSyncServer.username,
            })
          }}
        >
          Use it
        </Button>
      }
    >
      oboku's own sync server is on. To sync with the devices that use it, use
      it here too, with the password you generated for them.
    </Alert>
  )
})

const ConnectionForm = memo(function ConnectionForm() {
  const {
    mutate: connect,
    error,
    isPending,
  } = useConnectKoreaderSyncServer({
    meta: { suppressGlobalErrorToast: true },
  })
  const {
    control,
    handleSubmit,
    setValue,
    formState: { isValid },
  } = useForm<ConnectionFormValues>({
    mode: "onChange",
    defaultValues: { serverUrl: "", username: "", password: "" },
  })

  return (
    <PageContainer>
      <Stack
        component="form"
        onSubmit={handleSubmit(function connectWithFormValues(values) {
          connect(values)
        })}
        sx={{ gap: 2, py: 2 }}
      >
        <Typography>
          oboku's reader can sync its reading position through a KOReader sync
          server, like KOReader, Readest or CrossPoint do. Sign in with the
          account you use on your devices.
        </Typography>
        <ObokuSyncServerShortcut
          onUse={function fillInObokuSyncServer({ serverUrl, username }) {
            setValue("serverUrl", serverUrl, { shouldValidate: true })
            setValue("username", username, { shouldValidate: true })
          }}
        />
        <ControlledTextField
          control={control}
          name="serverUrl"
          label="Server"
          placeholder="https://sync.koreader.rocks"
          fullWidth
          rules={{
            required: true,
            validate: function validateServerUrl(value) {
              return (
                isHttpUrl(value) ||
                "Enter an address starting with http:// or https://"
              )
            },
          }}
        />
        <ControlledTextField
          control={control}
          name="username"
          label="Username"
          autoComplete="username"
          fullWidth
          rules={{ required: true }}
        />
        <ControlledTextField
          control={control}
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          fullWidth
          rules={{ required: true }}
        />
        {!!error && <ErrorAlert error={error} />}
        <Button
          type="submit"
          variant="contained"
          loading={isPending}
          disabled={!isValid}
        >
          Connect
        </Button>
      </Stack>
    </PageContainer>
  )
})

const ConnectionDetails = memo(function ConnectionDetails({
  connection,
}: {
  connection: KoreaderSyncConnection
}) {
  const { mutate: disconnect } = useDisconnectKoreaderSyncServer()

  const confirmThenDisconnect = async () => {
    const confirmed = await showConfirmDialog({
      title: "Disconnect from this sync server?",
      message:
        "oboku's reader stops syncing with it. Reading positions already on the server stay there.",
      actions: [{ title: "Disconnect" }],
    })

    if (!confirmed) return

    disconnect()
  }

  return (
    <PageContainer disableGutters>
      <PageSection title="Connected to">
        <ListItem>
          <ListItemText primary="Server" secondary={connection.serverUrl} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Username" secondary={connection.username} />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Connected on"
            secondary={new Date(connection.connectedAt).toLocaleString()}
          />
        </ListItem>
      </PageSection>
      <PageSection title="Danger zone" tone="danger">
        <ListItemButton onClick={confirmThenDisconnect}>
          <ListItemText
            primary="Disconnect"
            secondary="oboku's reader stops syncing with this server"
          />
        </ListItemButton>
      </PageSection>
    </PageContainer>
  )
})

export const KoreaderProgressSyncScreen = memo(
  function KoreaderProgressSyncScreen() {
    const { data, isPending } = useKoreaderSyncConnection()
    const connection = data?.connection

    return (
      <Page>
        <TopBarNavigation title="KOReader progress sync" />
        {!isPending &&
          (connection ? (
            <ConnectionDetails connection={connection} />
          ) : (
            <ConnectionForm />
          ))}
      </Page>
    )
  },
)
