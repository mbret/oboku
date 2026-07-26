import { useMemo } from "react"
import type { SvgIconComponent } from "@mui/icons-material"
import { LoginRounded, StorageRounded } from "@mui/icons-material"
import type { NotificationSeverity } from "@oboku/shared"
import { useActiveProfile } from "../../profiles"
import { ROUTES } from "../../navigation/routes"
import { useIsStoragePersisted } from "../../storage/useIsStoragePersisted"

export type LocalNotification = {
  id: string
  severity: NotificationSeverity
  title: string
  body: string | null
  action?: {
    label: string
    to: string
    icon: SvgIconComponent
  }
}

export const useLocalNotifications = (): LocalNotification[] => {
  const needsRelogin = useActiveProfile().data?.needsRelogin ?? false
  const { data: isStoragePersisted } = useIsStoragePersisted()

  return useMemo(() => {
    const notifications: LocalNotification[] = []

    if (needsRelogin) {
      notifications.push({
        id: "session_expired",
        severity: "warning",
        title: "Session expired",
        body: "Your session has expired. Please sign in again to continue.",
        action: {
          label: "Sign in again",
          to: ROUTES.SESSION_EXPIRED,
          icon: LoginRounded,
        },
      })
    }

    if (isStoragePersisted === false) {
      notifications.push({
        id: "storage_not_persisted",
        severity: "warning",
        title: "Storage not protected",
        body: "The browser may delete your library and uploaded books to reclaim space.",
        action: {
          label: "Manage storage",
          to: `${ROUTES.PROFILE}/manage-storage`,
          icon: StorageRounded,
        },
      })
    }

    return notifications
  }, [needsRelogin, isStoragePersisted])
}
