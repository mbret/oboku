import { memo } from "react"
import { Alert, Button, Stack, Typography } from "@mui/material"
import { Page } from "../../common/Page"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { useLocalNotifications } from "./useLocalNotifications"
import { LocalNotificationCard } from "./LocalNotificationCard"
import { useInboxNotifications } from "./useInboxNotifications"
import { useMarkAllNotificationsAsSeen } from "./useMarkAllNotificationsAsSeen"
import { useUnreadNotificationsCount } from "./useUnreadNotificationsCount"
import { NotificationCard } from "./NotificationCard"

export const NotificationsScreen = memo(function NotificationsScreen() {
  const notificationsQuery = useInboxNotifications()
  const { unreadCount } = useUnreadNotificationsCount()
  const markAllNotificationsAsSeen = useMarkAllNotificationsAsSeen()
  const localNotifications = useLocalNotifications()

  return (
    <Page>
      <TopBarNavigation
        title="Notifications"
        rightComponent={
          unreadCount > 0 ? (
            <Button
              color="inherit"
              variant="text"
              onClick={() => {
                markAllNotificationsAsSeen.mutate(undefined)
              }}
              disabled={markAllNotificationsAsSeen.isPending}
            >
              Mark all read
            </Button>
          ) : undefined
        }
      />
      <Stack
        sx={{
          p: 2,
          gap: 2,
        }}
      >
        {localNotifications.map((notification) => (
          <LocalNotificationCard
            key={notification.id}
            notification={notification}
          />
        ))}

        {notificationsQuery.isLoading && (
          <Typography
            sx={{
              color: "text.secondary",
            }}
          >
            Loading notifications…
          </Typography>
        )}

        {notificationsQuery.error && localNotifications.length === 0 && (
          <Alert severity="error">{notificationsQuery.error.message}</Alert>
        )}

        {notificationsQuery.data?.length === 0 &&
          !notificationsQuery.isLoading &&
          localNotifications.length === 0 && (
            <Alert severity="info">
              You do not have any notifications right now.
            </Alert>
          )}

        {notificationsQuery.data?.map((notification) => (
          <NotificationCard key={notification.id} notification={notification} />
        ))}
      </Stack>
    </Page>
  )
})
