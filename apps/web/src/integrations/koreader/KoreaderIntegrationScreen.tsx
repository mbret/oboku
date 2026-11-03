import { CloudSyncRounded, SyncRounded } from "@mui/icons-material"
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material"
import type {
  KoreaderSyncConnectionGetResponse,
  KoreaderSyncServerGetResponse,
} from "@oboku/shared"
import { Link } from "react-router"
import { Page } from "../../common/Page"
import { PageContainer } from "../../common/PageContainer"
import { PageSection } from "../../common/PageSection"
import { ROUTES } from "../../navigation/routes"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { useKoreaderSyncConnection } from "./client/useKoreaderSyncConnection"
import { useKoreaderSyncServer } from "./server/useKoreaderSyncServer"

const KOREADER_SYNC_SERVER_PURPOSE =
  "Let KOReader, Readest, CrossPoint… sync their reading position through oboku"

const describeKoreaderSyncServer = (
  koreaderSyncServer?: KoreaderSyncServerGetResponse,
) => {
  if (!koreaderSyncServer) return KOREADER_SYNC_SERVER_PURPOSE

  return koreaderSyncServer.passwordCreatedAt
    ? "On"
    : `Off · ${KOREADER_SYNC_SERVER_PURPOSE}`
}

const KOREADER_PROGRESS_SYNC_PURPOSE =
  "Sync oboku's reading position through a KOReader sync server"

const describeKoreaderSyncConnection = (
  response?: KoreaderSyncConnectionGetResponse,
) =>
  response?.connection
    ? `Syncing with ${response.connection.serverUrl}`
    : KOREADER_PROGRESS_SYNC_PURPOSE

export function KoreaderIntegrationScreen() {
  const { data: koreaderSyncServer } = useKoreaderSyncServer()
  const { data: koreaderSyncConnection } = useKoreaderSyncConnection()

  return (
    <Page bottomGutter={false}>
      <TopBarNavigation title="KOReader" showBack />
      <PageContainer disableGutters>
        <PageSection>
          <ListItemButton component={Link} to={ROUTES.KOREADER_SYNC_SERVER}>
            <ListItemIcon>
              <SyncRounded />
            </ListItemIcon>
            <ListItemText
              primary="KOReader sync server"
              secondary={describeKoreaderSyncServer(koreaderSyncServer)}
            />
          </ListItemButton>
          <ListItemButton component={Link} to={ROUTES.KOREADER_PROGRESS_SYNC}>
            <ListItemIcon>
              <CloudSyncRounded />
            </ListItemIcon>
            <ListItemText
              primary="KOReader progress sync"
              secondary={describeKoreaderSyncConnection(koreaderSyncConnection)}
            />
          </ListItemButton>
        </PageSection>
      </PageContainer>
    </Page>
  )
}
