import { useState } from "react"
import {
  Alert,
  Button,
  FormControl,
  ListItem,
  ListItemText,
  Stack,
  styled,
  Typography,
} from "@mui/material"
import type { OpdsServerDto } from "@oboku/shared"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { Page } from "../../common/Page"
import { PageContainer } from "../../common/PageContainer"
import { PageSection } from "../../common/PageSection"
import { IntroStack } from "../../common/IntroStack"
import { CopyableField } from "../../common/CopyableField"
import { OneTimePasswordField } from "../../common/OneTimePasswordField"
import { EmptyAlert } from "../../common/alerts/EmptyAlert"
import { FetchErrorAlert } from "../../common/alerts/FetchErrorAlert"
import { LoadingAlert } from "../../common/alerts/LoadingAlert"
import { UnavailableAlert } from "../../common/alerts/UnavailableAlert"
import { showConfirmDialog } from "../../common/dialogs/presets"
import { useConfig } from "../../config/useConfig"
import { isQueryUnavailable } from "../../queries/isQueryUnavailable"
import { useOpdsServers } from "../../opds/servers/useOpdsServers"
import { useCreateOpdsServer } from "../../opds/servers/useCreateOpdsServer"
import { useRegenerateOpdsServerPassword } from "../../opds/servers/useRegenerateOpdsServerPassword"
import { useDeleteOpdsServer } from "../../opds/servers/useDeleteOpdsServer"
import { RenameOpdsServerDialog } from "../../opds/servers/RenameOpdsServerDialog"

const ServerActionsStack = styled(Stack)(function styleServerActionsStack({
  theme,
}) {
  return {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing(1),
  }
})

const SETUP_STEPS = [
  "In KOReader's file browser, open the search menu (the magnifying glass), then OPDS catalog.",
  "Tap + at the top left, name the catalog, then enter the catalog URL, username and password of a server above.",
  "Other reading apps that support OPDS catalogs ask for the same three values.",
]

function OpdsServerSection({
  server,
  createdPassword,
}: {
  server: OpdsServerDto
  createdPassword: string | undefined
}) {
  const { data: config } = useConfig()
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
        <CopyableField
          label="Catalog URL"
          value={config ? `${config.API_OPDS_URL}/${server.slug}` : ""}
        />
        <CopyableField label="Username" value={server.username} />
        {newPassword ? (
          <OneTimePasswordField password={newPassword} />
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
  const {
    mutate: createServer,
    data: creationResult,
    isPending: isCreatingServer,
  } = useCreateOpdsServer()
  const serversNewestFirst = servers?.toSorted((a, b) => b.id - a.id)
  const isUnavailable = isQueryUnavailable(serversQuery)
  const hasNoServer = servers?.length === 0

  return (
    <Page>
      <TopBarNavigation title="OPDS servers" />
      <PageContainer>
        <IntroStack>
          <Typography>
            An OPDS server turns your library into a catalog that KOReader and
            the other reading apps that support OPDS can browse. Each server has
            its own address and password.
          </Typography>
          <Alert severity="info">
            Catalogs are empty for now: oboku cannot serve your books through
            them yet.
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
        </IntroStack>
      </PageContainer>
      <PageContainer disableGutters>
        {serversNewestFirst?.map((server) => (
          <OpdsServerSection
            key={server.id}
            server={server}
            createdPassword={
              creationResult?.server.id === server.id
                ? creationResult.password
                : undefined
            }
          />
        ))}
        <PageSection title="Set up a reading app">
          {SETUP_STEPS.map((step, index) => (
            <ListItem key={step}>
              <ListItemText primary={`${index + 1}. ${step}`} />
            </ListItem>
          ))}
        </PageSection>
      </PageContainer>
    </Page>
  )
}
