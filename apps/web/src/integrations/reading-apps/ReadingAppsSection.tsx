import { CloudSyncRounded, DnsRounded, SyncRounded } from "@mui/icons-material"
import type {
  KoreaderSyncConnectionGetResponse,
  KoreaderSyncServerGetResponse,
} from "@oboku/shared"
import { ListItemLink } from "../../common/lists"
import { PageSection } from "../../common/PageSection"
import { ROUTES } from "../../navigation/routes"
import { useKoreaderSyncConnection } from "../koreader/client/useKoreaderSyncConnection"
import { useKoreaderSyncServer } from "../koreader/server/useKoreaderSyncServer"

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

export function ReadingAppsSection() {
  const { data: koreaderSyncServer } = useKoreaderSyncServer()
  const { data: koreaderSyncConnection } = useKoreaderSyncConnection()

  return (
    <PageSection title="Reading apps">
      <ListItemLink
        to={ROUTES.OPDS_SERVERS}
        icon={<DnsRounded />}
        primary="OPDS servers"
        secondary="Let KOReader and other reading apps browse your library"
      />
      <ListItemLink
        to={ROUTES.KOREADER_SYNC_SERVER}
        icon={<SyncRounded />}
        primary="KOReader sync server"
        secondary={describeKoreaderSyncServer(koreaderSyncServer)}
      />
      <ListItemLink
        to={ROUTES.KOREADER_PROGRESS_SYNC}
        icon={<CloudSyncRounded />}
        primary="KOReader progress sync"
        secondary={describeKoreaderSyncConnection(koreaderSyncConnection)}
      />
    </PageSection>
  )
}
