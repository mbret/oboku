import { memo, useState } from "react"
import {
  Link,
  Button,
  ListItemText,
  ListItemIcon,
  Typography,
  useTheme,
  Box,
  ListItemButton,
  IconButton,
  Stack,
} from "@mui/material"
import { Alert } from "@mui/material"
import { LibrarySyncsAddDrawer } from "../../librarySyncs/LibrarySyncsAddDrawer"
import { LibrarySyncActionsDrawer } from "../../librarySyncs/LibrarySyncActionsDrawer"
import {
  Error as ErrorIcon,
  LockRounded,
  MoreVertOutlined,
} from "@mui/icons-material"
import { type LibrarySyncDocType, links } from "@oboku/shared"
import { plugins } from "../../integrations/plugins/configure"
import { errorToMessage } from "../../errors/ErrorMessage"
import { useLibrarySyncs } from "../../librarySyncs/useLibrarySyncs"
import { generatePath, useNavigate, Link as RouterLink } from "react-router"
import { ROUTES } from "../../navigation/routes"
import type { DeepReadonly } from "rxdb"
import { useLibrarySyncLabel } from "../../librarySyncs/useLibrarySyncLabel"
import { PageContainer } from "../../common/PageContainer"
import { PageSection } from "../../common/PageSection"
import { Page } from "../../common/Page"

export const LibrarySyncsListScreen = memo(function LibrarySyncsListScreen() {
  const [isDrawerOpened, setIsDrawerOpened] = useState(false)
  const [isActionsDrawerOpenWith, setIsActionsDrawerOpenWith] = useState<
    string | undefined
  >(undefined)
  const { data: librarySyncs } = useLibrarySyncs()
  const theme = useTheme()
  const navigate = useNavigate()

  return (
    <>
      <Page bottomGutter={false}>
        <PageContainer>
          <Stack
            sx={{
              gap: 1,
              mt: 2,
            }}
          >
            <Alert severity="info">
              Keep your library up to date with the books of a source, such as a
              shared Google Drive folder.{" "}
              <Link href={links.documentation} target="_blank">
                Learn more
              </Link>
            </Alert>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setIsDrawerOpened(true)}
            >
              Add a sync
            </Button>
          </Stack>
        </PageContainer>
        <PageContainer disableGutters>
          <PageSection>
            {librarySyncs?.map((librarySync) => {
              const plugin = plugins.find(
                (plugin) => plugin.type === librarySync.type,
              )

              return (
                <ListItemButton
                  key={librarySync._id}
                  component={RouterLink}
                  to={generatePath(ROUTES.LIBRARY_SYNC_DETAILS, {
                    id: librarySync._id,
                  })}
                >
                  {plugin && (
                    <ListItemIcon>
                      <plugin.Icon />
                    </ListItemIcon>
                  )}
                  <ListItemText
                    primary={<LibrarySyncLabel librarySync={librarySync} />}
                    secondary={
                      librarySync?.syncStatus === "fetching" ? (
                        "Syncing..."
                      ) : librarySync?.lastSyncErrorCode ? (
                        <Box
                          component="span"
                          style={{ flexDirection: "row", display: "flex" }}
                        >
                          <ErrorIcon
                            fontSize="small"
                            style={{ marginRight: theme.spacing(1) }}
                          />
                          <Typography variant="body2" component="span">
                            {`Sync did not succeed. ${errorToMessage(librarySync.lastSyncErrorCode)}`}
                          </Typography>
                        </Box>
                      ) : librarySync?.lastSyncedAt ? (
                        `Last synced at ${new Date(
                          librarySync?.lastSyncedAt,
                        ).toDateString()}`
                      ) : (
                        "Not synced yet"
                      )
                    }
                  />
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: "center",
                    }}
                  >
                    {librarySync?.isProtected && (
                      <LockRounded color="disabled" />
                    )}
                    <IconButton
                      aria-label="More actions"
                      edge="end"
                      disableTouchRipple
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setIsActionsDrawerOpenWith(librarySync._id)
                      }}
                    >
                      <MoreVertOutlined />
                    </IconButton>
                  </Stack>
                </ListItemButton>
              )
            })}
          </PageSection>
        </PageContainer>
      </Page>
      <LibrarySyncsAddDrawer
        open={isDrawerOpened}
        onClose={(type) => {
          setIsDrawerOpened(false)
          const plugin = plugins.find((plugin) => type === plugin.type)

          if (plugin) {
            navigate(
              generatePath(ROUTES.SYNC_NEW_LIBRARY_SYNC, {
                type: plugin.type,
              }),
            )
          }
        }}
      />
      <LibrarySyncActionsDrawer
        openWith={isActionsDrawerOpenWith}
        onClose={() => setIsActionsDrawerOpenWith(undefined)}
      />
    </>
  )
})

const LibrarySyncLabel = ({
  librarySync,
}: {
  librarySync: DeepReadonly<LibrarySyncDocType>
}) => {
  const label = useLibrarySyncLabel(librarySync)

  return <Typography noWrap>{label}</Typography>
}
