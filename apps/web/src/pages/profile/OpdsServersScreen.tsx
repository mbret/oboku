import { memo, useState } from "react"
import {
  Alert,
  Button,
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
import { showConfirmDialog } from "../../common/dialogs/presets"
import { useConfig } from "../../config/useConfig"
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

export const OpdsServersScreen = memo(function OpdsServersScreen() {
  const { data: config } = useConfig()
  const { data: servers } = useOpdsServers()
  const serversNewestFirst = servers?.toSorted((a, b) => b.id - a.id)
  const {
    mutate: createServer,
    data: createdServer,
    reset: forgetCreatedPassword,
    isPending: isCreatingServer,
  } = useCreateOpdsServer()
  const {
    mutate: regeneratePassword,
    data: regeneratedPassword,
    reset: forgetRegeneratedPassword,
    isPending: isRegeneratingPassword,
    variables: serverIdGettingPassword,
  } = useRegenerateOpdsServerPassword()
  const {
    mutate: deleteServer,
    isPending: isDeletingServer,
    variables: serverIdBeingDeleted,
  } = useDeleteOpdsServer()
  const [serverToRename, setServerToRename] = useState<OpdsServerDto>()
  const revealedPassword = createdServer ?? regeneratedPassword

  const createServerAndRevealPassword = () => {
    createServer(undefined, { onSuccess: forgetRegeneratedPassword })
  }

  const confirmThenRegeneratePassword = async (server: OpdsServerDto) => {
    const confirmed = await showConfirmDialog({
      title: "Generate a new password?",
      message: `Reading apps signed in to ${server.name} with the current password cannot open its catalog until you sign them in again with the new one.`,
      actions: [{ title: "Generate" }],
    })

    if (!confirmed) return

    regeneratePassword(server.id, { onSuccess: forgetCreatedPassword })
  }

  const confirmThenDelete = async (server: OpdsServerDto) => {
    const confirmed = await showConfirmDialog({
      title: `Delete ${server.name}?`,
      message: "Reading apps signed in to it can no longer open its catalog.",
      actions: [{ title: "Delete" }],
    })

    if (!confirmed) return

    deleteServer(server.id)
  }

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
            onClick={createServerAndRevealPassword}
          >
            Create a server
          </Button>
        </IntroStack>
      </PageContainer>
      <PageContainer disableGutters>
        {serversNewestFirst?.map((server) => {
          const isPasswordRevealed = revealedPassword?.server.id === server.id

          return (
            <PageSection key={server.id} title={server.name} variant="stack">
              <CopyableField
                label="Catalog URL"
                value={config ? `${config.API_OPDS_URL}/${server.slug}` : ""}
              />
              <CopyableField label="Username" value={server.username} />
              {isPasswordRevealed ? (
                <>
                  <CopyableField
                    label="Password"
                    value={revealedPassword.password}
                  />
                  <Alert severity="warning">
                    Copy this password now: it is not shown again.
                  </Alert>
                </>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Its password cannot be shown again, generate a new one if you
                  lost it.
                </Typography>
              )}
              <ServerActionsStack>
                <Button
                  onClick={function openRenameDialog() {
                    setServerToRename(server)
                  }}
                >
                  Rename
                </Button>
                <Button
                  loading={
                    isRegeneratingPassword &&
                    serverIdGettingPassword === server.id
                  }
                  onClick={function regeneratePasswordOfServer() {
                    void confirmThenRegeneratePassword(server)
                  }}
                >
                  Generate a new password
                </Button>
                <Button
                  color="error"
                  loading={
                    isDeletingServer && serverIdBeingDeleted === server.id
                  }
                  onClick={function deleteThisServer() {
                    void confirmThenDelete(server)
                  }}
                >
                  Delete
                </Button>
              </ServerActionsStack>
            </PageSection>
          )
        })}
        <PageSection title="Set up a reading app">
          {SETUP_STEPS.map((step, index) => (
            <ListItem key={step}>
              <ListItemText primary={`${index + 1}. ${step}`} />
            </ListItem>
          ))}
        </PageSection>
      </PageContainer>
      {serverToRename && (
        <RenameOpdsServerDialog
          server={serverToRename}
          onClose={function closeRenameDialog() {
            setServerToRename(undefined)
          }}
        />
      )}
    </Page>
  )
})
