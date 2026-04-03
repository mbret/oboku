import { memo } from "react"
import { Alert, Button, Stack, Typography } from "@mui/material"
import type { UserNotification } from "@oboku/shared"
import { useNavigate } from "react-router"
import { Page } from "../../common/Page"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { ROUTES } from "../../navigation/routes"
import { useArchiveNotification } from "./useArchiveNotification"
import { useInboxNotifications } from "./useInboxNotifications"
import { useMarkAllNotificationsAsSeen } from "./useMarkAllNotificationsAsSeen"
import { useMarkNotificationAsSeen } from "./useMarkNotificationAsSeen"
import { useUnreadNotificationsCount } from "./useUnreadNotificationsCount"
import { NotificationCard } from "./NotificationCard"

export const NotificationsScreen = memo(function NotificationsScreen() {
  const navigate = useNavigate()
  const notificationsQuery = useInboxNotifications()
  const { unreadCount } = useUnreadNotificationsCount()
  const markNotificationAsSeen = useMarkNotificationAsSeen()
  const markAllNotificationsAsSeen = useMarkAllNotificationsAsSeen()
  const archiveNotification = useArchiveNotification()

  const openNotificationCta = async (notification: UserNotification) => {
    if (!notification.seenAt) {
      await markNotificationAsSeen.mutateAsync({ id: notification.id })
    }

    switch (notification.kind) {
      case "sync_finished":
        navigate(ROUTES.SYNC_REPORTS)
        return
      case "admin_broadcast":
        return
    }
  }

  return (
    <Page bottomGutter={false}>
      <TopBarNavigation
        title="Notifications"
        rightComponent={
          unreadCount > 0 ? (
            <Button
              color="inherit"
              onClick={() => {
                markAllNotificationsAsSeen.mutate()
              }}
              disabled={markAllNotificationsAsSeen.isPending}
            >
              Mark all read
            </Button>
          ) : undefined
        }
      />
      <Stack p={2} gap={2}>
        {notificationsQuery.isLoading && (
          <Typography color="text.secondary">Loading notifications…</Typography>
        )}

        {notificationsQuery.error && (
          <Alert severity="error">{notificationsQuery.error.message}</Alert>
        )}

        {notificationsQuery.data?.length === 0 &&
          !notificationsQuery.isLoading && (
            <Alert severity="info">
              You do not have any notifications right now.
            </Alert>
          )}

        {notificationsQuery.data?.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onMarkAsSeen={(id) => {
              markNotificationAsSeen.mutate({ id })
            }}
            onOpenCta={(n) => {
              void openNotificationCta(n)
            }}
            onArchive={(id) => {
              archiveNotification.mutate({ id })
            }}
            isMarkingAsSeen={markNotificationAsSeen.isPending}
            isArchiving={archiveNotification.isPending}
          />
        ))}
      </Stack>
    </Page>
  )
})
