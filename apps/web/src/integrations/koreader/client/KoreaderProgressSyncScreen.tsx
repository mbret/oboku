import { memo } from "react"
import {
  Alert,
  Button,
  Link,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  styled,
  Typography,
} from "@mui/material"
import type { KoreaderSyncConnectionDto } from "@oboku/shared"
import { useForm } from "react-hook-form"
import { Link as RouterLink } from "react-router"
import { TopBarNavigation } from "../../../navigation/TopBarNavigation"
import { ROUTES } from "../../../navigation/routes"
import { Page } from "../../../common/Page"
import { PageContainer } from "../../../common/PageContainer"
import { PageSection } from "../../../common/PageSection"
import { IntroStack } from "../../../common/IntroStack"
import { ControlledTextField } from "../../../common/forms/ControlledTextField"
import { showConfirmDialog } from "../../../common/dialogs/presets"
import { ErrorAlert } from "../../../errors/ErrorMessage"
import { useConfig } from "../../../config/useConfig"
import { useKoreaderSyncServer } from "../server/useKoreaderSyncServer"
import { useKoreaderSyncConnection } from "./useKoreaderSyncConnection"
import { useConnectKoreaderSyncServer } from "./useConnectKoreaderSyncServer"
import { useDisconnectKoreaderSyncServer } from "./useDisconnectKoreaderSyncServer"

const SubmitButtonStack = styled(Stack)(function styleSubmitButtonStack({
  theme,
}) {
  return {
    padding: theme.spacing(0, 2, 2),
  }
})

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
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

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
    <>
      <PageContainer>
        <IntroStack>
          <Typography>
            oboku's reader can sync its reading position through a KOReader sync
            server, like KOReader, Readest or CrossPoint do. Use the server and
            account your devices use.
          </Typography>
          <ObokuSyncServerShortcut
            onUse={function fillInObokuSyncServer({ serverUrl, username }) {
              setValue("serverUrl", serverUrl, { shouldValidate: true })
              setValue("username", username, { shouldValidate: true })
            }}
          />
        </IntroStack>
      </PageContainer>
      <PageContainer disableGutters>
        <form
          onSubmit={handleSubmit(function connectWithFormValues(values) {
            connect(values)
          })}
        >
          <PageSection variant="stack">
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
          </PageSection>
          <SubmitButtonStack>
            <Button
              type="submit"
              variant="contained"
              loading={isPending}
              disabled={!isValid}
            >
              Turn on
            </Button>
          </SubmitButtonStack>
        </form>
      </PageContainer>
    </>
  )
})

const ConnectionDetails = memo(function ConnectionDetails({
  connection,
}: {
  connection: KoreaderSyncConnectionDto
}) {
  const { mutate: disconnect } = useDisconnectKoreaderSyncServer()

  const confirmThenDisconnect = async () => {
    const confirmed = await showConfirmDialog({
      title: "Turn off progress sync?",
      message:
        "oboku's reader stops syncing with this server. The reading positions already on it stay there.",
      actions: [{ title: "Turn off" }],
    })

    if (!confirmed) return

    disconnect()
  }

  return (
    <PageContainer disableGutters>
      <PageSection title="Syncing with">
        <ListItem>
          <ListItemText primary="Server" secondary={connection.serverUrl} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Username" secondary={connection.username} />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Turned on"
            secondary={new Date(connection.connectedAt).toLocaleString()}
          />
        </ListItem>
      </PageSection>
      <PageSection title="Danger zone" tone="danger">
        <ListItemButton onClick={confirmThenDisconnect}>
          <ListItemText
            primary="Turn off progress sync"
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
