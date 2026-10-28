import { useCallback, useState } from "react"
import {
  BarChartRounded,
  CloudSyncRounded,
  GavelRounded,
  KeyRounded,
  LaunchRounded,
  LockOpenRounded,
  LockRounded,
  NotificationsRounded,
  RssFeedRounded,
  SecurityRounded,
  SettingsRounded,
  StorageRounded,
  SyncRounded,
} from "@mui/icons-material"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import {
  Badge,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from "@mui/material"
import { useNavigate } from "react-router"
import {
  formatBytes,
  type KoreaderSyncConnectionGetResponse,
  type KoreaderSyncServerGetResponse,
  links,
} from "@oboku/shared"
import { useStorageUse } from "../../settings/useStorageUse"
import { useSignOut } from "../../auth/useSignOut"
import {
  libraryStateSignal,
  selectIsLibraryUnlocked,
} from "../../library/books/states"
import { lockLibrary, unlockLibrary } from "../../library/libraryLock"
import { toggleDebug } from "../../debug"
import { useDatabase } from "../../rxdb"
import { isDebugEnabled } from "../../debug/isDebugEnabled.shared"
import { useSignalValue } from "reactjrx"
import { useActiveProfile } from "../../profiles"
import { useRemoveAllContents } from "../../settings/useRemoveAllContents"
import { showDialog } from "../../common/dialogs/createDialog"
import {
  createNotImplementedDialogOptions,
  showConfirmDialog,
} from "../../common/dialogs/presets"
import { countLocalOnlyDownloadedBooks } from "../../download/countLocalOnlyDownloadedBooks"
import { ROUTES } from "../../navigation/routes"
import { Page } from "../../common/Page"
import { useUnreadNotificationsCount } from "../../notifications/inbox/useUnreadNotificationsCount"
import { DeleteAccountDialog } from "../../auth/DeleteAccountDialog"
import { PageContainer } from "../../common/PageContainer"
import { PageSection } from "../../common/PageSection"
import { useKoreaderSyncServer } from "../../koreader/syncServer/useKoreaderSyncServer"
import { useKoreaderSyncConnection } from "../../koreader/syncConnection/useKoreaderSyncConnection"

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

function KoreaderProgressSyncListItem() {
  const navigate = useNavigate()
  const { data: koreaderSyncConnection } = useKoreaderSyncConnection()

  return (
    <ListItemButton
      onClick={function openKoreaderProgressSync() {
        navigate(ROUTES.KOREADER_PROGRESS_SYNC)
      }}
    >
      <ListItemIcon>
        <CloudSyncRounded />
      </ListItemIcon>
      <ListItemText
        primary="KOReader progress sync"
        secondary={describeKoreaderSyncConnection(koreaderSyncConnection)}
      />
    </ListItemButton>
  )
}

export const ProfileScreen = () => {
  const navigate = useNavigate()
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] =
    useState(false)
  const { quotaUsed, quota, usage } = useStorageUse({ intervalMs: 5000 })
  const { data: auth } = useActiveProfile()
  const { data: koreaderSyncServer } = useKoreaderSyncServer()
  const isLibraryUnlocked = useSignalValue(
    libraryStateSignal,
    selectIsLibraryUnlocked,
  )
  const signOut = useSignOut()
  const { mutate: removeAllContents } = useRemoveAllContents()
  const { unreadCount } = useUnreadNotificationsCount()
  const { db } = useDatabase()

  const confirmThenSignOut = useCallback(
    async function confirmThenSignOut() {
      const localOnlyBookCount = db
        ? await countLocalOnlyDownloadedBooks(db)
        : 0

      if (localOnlyBookCount > 0) {
        const lostBooks =
          localOnlyBookCount === 1
            ? "1 book you added directly from this device has"
            : `${localOnlyBookCount} books you added directly from this device have`

        const confirmed = await showConfirmDialog({
          title: "Sign out?",
          message: `Signing out erases everything downloaded on this device. ${lostBooks} no cloud copy and will be permanently lost.`,
          cancelTitle: "Cancel",
          actions: [{ title: "Sign out", variant: "contained" }],
        })

        if (!confirmed) return
      }

      signOut()
    },
    [db, signOut],
  )

  return (
    <Page bottomGutter={false}>
      <TopBarNavigation title={"Profile"} showBack={false} />
      <PageContainer disableGutters>
        <PageSection title="Account">
          <ListItemButton onClick={confirmThenSignOut}>
            <ListItemText primary="Sign out" secondary={auth?.email} />
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              if (isLibraryUnlocked) {
                lockLibrary()
              } else {
                unlockLibrary()
              }
            }}
          >
            <ListItemText
              primary={
                isLibraryUnlocked
                  ? "Protected contents are visible"
                  : "Protected contents are hidden"
              }
              secondary={
                isLibraryUnlocked ? "Click to lock" : "Click to unlock"
              }
            />
            {isLibraryUnlocked && <LockOpenRounded color="action" />}
            {!isLibraryUnlocked && <LockRounded color="action" />}
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              navigate(ROUTES.NOTIFICATIONS)
            }}
          >
            <ListItemIcon>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsRounded />
              </Badge>
            </ListItemIcon>
            <ListItemText
              primary="Notifications"
              secondary={unreadCount > 0 ? `${unreadCount} unread` : "Inbox"}
            />
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              navigate(ROUTES.SECURITY)
            }}
          >
            <ListItemIcon>
              <SecurityRounded />
            </ListItemIcon>
            <ListItemText primary="Security" />
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              navigate(ROUTES.SECRETS)
            }}
          >
            <ListItemIcon>
              <KeyRounded />
            </ListItemIcon>
            <ListItemText primary="Secrets" />
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              navigate(ROUTES.STATISTICS)
            }}
          >
            <ListItemIcon>
              <BarChartRounded />
            </ListItemIcon>
            <ListItemText primary="Statistics" />
          </ListItemButton>
        </PageSection>
        <PageSection title="Other apps">
          <ListItemButton
            onClick={() => {
              navigate(ROUTES.KOREADER_SYNC_SERVER)
            }}
          >
            <ListItemIcon>
              <SyncRounded />
            </ListItemIcon>
            <ListItemText
              primary="KOReader sync server"
              secondary={describeKoreaderSyncServer(koreaderSyncServer)}
            />
          </ListItemButton>
          <KoreaderProgressSyncListItem />
          <ListItemButton
            onClick={() => {
              navigate(ROUTES.OPDS_SERVERS)
            }}
          >
            <ListItemIcon>
              <RssFeedRounded />
            </ListItemIcon>
            <ListItemText
              primary="OPDS servers"
              secondary="Let KOReader and other reading apps browse your library"
            />
          </ListItemButton>
        </PageSection>
        <PageSection title="Device">
          <ListItemButton
            onClick={() => {
              navigate(ROUTES.SETTINGS)
            }}
          >
            <ListItemIcon>
              <SettingsRounded />
            </ListItemIcon>
            <ListItemText primary="Device settings" />
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              navigate(ROUTES.MANAGE_STORAGE)
            }}
          >
            <ListItemIcon>
              <StorageRounded />
            </ListItemIcon>
            <ListItemText
              primary="Storage"
              secondary={`${formatBytes(usage)} (${(quotaUsed * 100).toFixed(2)}%) used of ${formatBytes(quota)}`}
            />
          </ListItemButton>
        </PageSection>
        <PageSection title="Information">
          <ListItemButton target="_blank" href={links.documentationSupport}>
            <ListItemIcon>
              <LaunchRounded />
            </ListItemIcon>
            <ListItemText primary={`Support Page`} />
          </ListItemButton>
          <ListItemButton target="_blank" href={links.documentation}>
            <ListItemIcon>
              <LaunchRounded />
            </ListItemIcon>
            <ListItemText primary={`Documentation Page`} />
          </ListItemButton>
          <ListItemButton
            onClick={() => showDialog(createNotImplementedDialogOptions())}
          >
            <ListItemIcon>
              <GavelRounded />
            </ListItemIcon>
            <ListItemText primary="Terms of Service" />
          </ListItemButton>
          <ListItem>
            <ListItemText primary="App Version" secondary={__APP_VERSION__} />
          </ListItem>
        </PageSection>
        <PageSection title="Developer options">
          <ListItemButton onClick={toggleDebug}>
            <ListItemText
              primary={
                isDebugEnabled() ? "Disable debug mode" : "Enable debug mode"
              }
            />
          </ListItemButton>
        </PageSection>
        <PageSection title="Danger zone" tone="danger">
          <ListItemButton onClick={() => navigate(ROUTES.PROBLEMS)}>
            <ListItemText
              primary="Repair my account / anomalies"
              secondary="If you start noticing problems with your data (missing items, sync, ...) you may try to repair your account using one this section"
            />
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              removeAllContents()
            }}
          >
            <ListItemText
              primary="Reset account"
              secondary="Remove all contents from your account"
            />
          </ListItemButton>
          <ListItemButton onClick={() => setIsDeleteAccountDialogOpen(true)}>
            <ListItemText primary="Delete my account" />
          </ListItemButton>
        </PageSection>
      </PageContainer>
      <DeleteAccountDialog
        open={isDeleteAccountDialogOpen}
        onClose={() => setIsDeleteAccountDialogOpen(false)}
      />
    </Page>
  )
}
