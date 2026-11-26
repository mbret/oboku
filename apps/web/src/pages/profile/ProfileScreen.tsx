import { useCallback, useState } from "react"
import { ListItemExternalLink } from "../../common/lists"
import {
  BarChartRounded,
  DataUsageRounded,
  GavelRounded,
  KeyRounded,
  LaunchRounded,
  LockOpenRounded,
  LockRounded,
  NewReleasesRounded,
  NotificationsRounded,
  SecurityRounded,
  SettingsRounded,
  StorageRounded,
} from "@mui/icons-material"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import {
  Badge,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from "@mui/material"
import { useNavigate } from "react-router"
import { formatBytes, links } from "@oboku/shared"
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
import { showConfirmDialog } from "../../common/dialogs/presets"
import { countLocalOnlyDownloadedBooks } from "../../download/countLocalOnlyDownloadedBooks"
import { ROUTES } from "../../navigation/routes"
import { Page } from "../../common/Page"
import { useUnreadNotificationsCount } from "../../notifications/inbox/useUnreadNotificationsCount"
import { DeleteAccountDialog } from "../../auth/DeleteAccountDialog"
import { PageContainer } from "../../common/PageContainer"
import { PageSection } from "../../common/PageSection"
import { useProxiedDownloadQuota } from "../../quotas/useProxiedDownloadQuota"
import { InstallAppListItem } from "./InstallAppListItem"

export const ProfileScreen = () => {
  const navigate = useNavigate()
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] =
    useState(false)
  const { quotaUsed, quota, usage } = useStorageUse({ intervalMs: 5000 })
  const { data: auth } = useActiveProfile()
  const isLibraryUnlocked = useSignalValue(
    libraryStateSignal,
    selectIsLibraryUnlocked,
  )
  const signOut = useSignOut()
  const { mutate: removeAllContents } = useRemoveAllContents()
  const { unreadCount } = useUnreadNotificationsCount()
  const { data: proxiedDownloadQuota } = useProxiedDownloadQuota()
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
          <ListItemButton
            onClick={function openQuotas() {
              navigate(ROUTES.QUOTAS)
            }}
          >
            <ListItemIcon>
              <DataUsageRounded />
            </ListItemIcon>
            <ListItemText
              primary="Quotas"
              secondary={
                proxiedDownloadQuota &&
                `Downloads: ${formatBytes(proxiedDownloadQuota.userUsedBytes)} used of ${formatBytes(proxiedDownloadQuota.userQuotaBytes)} this month`
              }
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
          <InstallAppListItem />
        </PageSection>
        <PageSection title="Information">
          <ListItemExternalLink
            href={links.documentationSupport}
            icon={<LaunchRounded />}
            primary="Support"
          />
          <ListItemExternalLink
            href={links.documentation}
            icon={<LaunchRounded />}
            primary="Documentation"
          />
          <ListItemExternalLink
            href={links.privacyPolicy}
            icon={<GavelRounded />}
            primary="Privacy Policy"
          />
          <ListItemExternalLink
            href={links.changelog}
            icon={<NewReleasesRounded />}
            primary="App Version"
            secondary={__APP_VERSION__}
          />
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
