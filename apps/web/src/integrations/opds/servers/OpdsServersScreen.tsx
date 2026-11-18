import { useState } from "react"
import { LaunchRounded } from "@mui/icons-material"
import {
  Alert,
  Button,
  FormControl,
  Link,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  styled,
  Typography,
} from "@mui/material"
import { links, type OpdsServerDto } from "@oboku/shared"
import { Link as RouterLink } from "react-router"
import { ROUTES } from "../../../navigation/routes"
import { TopBarNavigation } from "../../../navigation/TopBarNavigation"
import { Page } from "../../../common/Page"
import { PageContainer } from "../../../common/PageContainer"
import { PageSection } from "../../../common/PageSection"
import { TextField } from "../../../common/forms/TextField"
import { GeneratedPasswordField } from "../../../common/forms/GeneratedPasswordField"
import { EmptyAlert } from "../../../common/alerts/EmptyAlert"
import { FetchErrorAlert } from "../../../common/alerts/FetchErrorAlert"
import { LoadingAlert } from "../../../common/alerts/LoadingAlert"
import { UnavailableAlert } from "../../../common/alerts/UnavailableAlert"
import { showConfirmDialog } from "../../../common/dialogs/presets"
import { useConfig } from "../../../config/useConfig"
import { isQueryUnavailable } from "../../../queries/isQueryUnavailable"
import { useOpdsServers } from "./useOpdsServers"
import { useCreateOpdsServer } from "./useCreateOpdsServer"
import { useRegenerateOpdsServerPassword } from "./useRegenerateOpdsServerPassword"
import { useDeleteOpdsServer } from "./useDeleteOpdsServer"
import { RenameOpdsServerDialog } from "./RenameOpdsServerDialog"
import { CatalogSourcesSection } from "./CatalogSourcesSection"

const ServerActionsStack = styled(Stack)(function styleServerActionsStack({
  theme,
}) {
  return {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing(1),
  }
})

function OpdsServerSection({
  server,
  createdPassword,
}: {
  server: OpdsServerDto
  createdPassword: string | undefined
}) {
  const { data: config } = useConfig()
  const opds1CatalogUrl = config ? `${config.API_OPDS_URL}/${server.slug}` : ""
  const opds2CatalogUrl = config
    ? `${config.API_OPDS_URL}/${server.slug}/v2`
    : ""
  const {
    mutate: regeneratePassword,
    data: regenerationResult,
    isIdle: isRegenerationIdle,
    isPending: isRegeneratingPassword,
  } = useRegenerateOpdsServerPassword()
  const { mutate: deleteServer, isPending: isDeletingServer } =
    useDeleteOpdsServer()
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const hasRequestedNewPassword = !isRegenerationIdle
  const newPassword = hasRequestedNewPassword
    ? regenerationResult?.password
    : createdPassword

  const confirmThenRegeneratePassword = async () => {
    const confirmed = await showConfirmDialog({
      title: "Generate a new password?",
      message: `Reading apps signed in to ${server.name} with the current password cannot open its catalog until you sign them in again with the new one.`,
      actions: [{ title: "Generate" }],
    })

    if (!confirmed) return

    regeneratePassword(server.id)
  }

  const confirmThenDelete = async () => {
    const confirmed = await showConfirmDialog({
      title: `Delete ${server.name}?`,
      message: "Reading apps signed in to it can no longer open its catalog.",
      actions: [{ title: "Delete" }],
    })

    if (!confirmed) return

    deleteServer(server.id)
  }

  return (
    <FormControl component="fieldset" fullWidth aria-label={server.name}>
      <PageSection title={server.name} variant="stack">
        <TextField
          label="OPDS 1.2 catalog URL"
          value={opds1CatalogUrl}
          copyable
          fullWidth
          slotProps={{ input: { readOnly: true } }}
        />
        <TextField
          label="OPDS 2.0 catalog URL"
          value={opds2CatalogUrl}
          copyable
          fullWidth
          slotProps={{ input: { readOnly: true } }}
        />
        <TextField
          label="Username"
          value={server.username}
          copyable
          fullWidth
          slotProps={{ input: { readOnly: true } }}
        />
        {newPassword ? (
          <GeneratedPasswordField password={newPassword} />
        ) : (
          <Typography variant="body2" color="textSecondary">
            Its password cannot be shown again, generate a new one if you lost
            it.
          </Typography>
        )}
        <ServerActionsStack>
          <Button
            onClick={function openRenameDialog() {
              setIsRenameDialogOpen(true)
            }}
          >
            Rename
          </Button>
          <Button
            loading={isRegeneratingPassword}
            onClick={confirmThenRegeneratePassword}
          >
            Generate a new password
          </Button>
          <Button
            color="error"
            loading={isDeletingServer}
            onClick={confirmThenDelete}
          >
            Delete
          </Button>
        </ServerActionsStack>
      </PageSection>
      {isRenameDialogOpen && (
        <RenameOpdsServerDialog
          server={server}
          onClose={function closeRenameDialog() {
            setIsRenameDialogOpen(false)
          }}
        />
      )}
    </FormControl>
  )
}

export function OpdsServersScreen() {
  const serversQuery = useOpdsServers()
  const { data: servers, isLoading, isError } = serversQuery
  const [createdPasswords, setCreatedPasswords] = useState<
    ReadonlyMap<OpdsServerDto["id"], string>
  >(new Map())
  const { mutate: createServer, isPending: isCreatingServer } =
    useCreateOpdsServer({
      onSuccess: function keepCreatedPassword({ server, password }) {
        setCreatedPasswords((passwords) =>
          new Map(passwords).set(server.id, password),
        )
      },
    })
  const serversNewestFirst = servers?.toSorted((a, b) => b.id - a.id)
  const isUnavailable = isQueryUnavailable(serversQuery)
  const hasNoServer = servers?.length === 0

  return (
    <Page>
      <TopBarNavigation title="OPDS servers" showBack />
      <PageContainer>
        <Stack spacing={2} sx={{ pt: 2 }}>
          <Typography>
            An OPDS server turns your library into a catalog that KOReader and
            other reading apps can browse, in OPDS 1.2 or OPDS 2.0. Each server
            has its own address and password.
          </Typography>
          <Alert severity="info">
            Downloads from your OPDS servers count towards the monthly{" "}
            <Link component={RouterLink} to={ROUTES.QUOTAS}>
              download quota
            </Link>
            .
          </Alert>
          <Button
            variant="contained"
            loading={isCreatingServer}
            disabled={!servers}
            onClick={function createNewServer() {
              createServer()
            }}
          >
            Create a server
          </Button>
          {isLoading && <LoadingAlert subject="OPDS servers" />}
          {isError && <FetchErrorAlert subject="OPDS servers" />}
          {isUnavailable && <UnavailableAlert subject="OPDS servers" />}
          {hasNoServer && <EmptyAlert subject="OPDS servers" />}
        </Stack>
      </PageContainer>
      <PageContainer disableGutters>
        {serversNewestFirst?.map((server) => (
          <OpdsServerSection
            key={server.id}
            server={server}
            createdPassword={createdPasswords.get(server.id)}
          />
        ))}
        <CatalogSourcesSection />
        <PageSection title="Set up a reading app">
          <ListItemButton
            target="_blank"
            href={links.documentationOpdsServersReadingApp}
          >
            <ListItemIcon>
              <LaunchRounded />
            </ListItemIcon>
            <ListItemText
              primary="Read the guide"
              secondary="Add a catalog to KOReader or another reading app"
            />
          </ListItemButton>
        </PageSection>
      </PageContainer>
    </Page>
  )
}
