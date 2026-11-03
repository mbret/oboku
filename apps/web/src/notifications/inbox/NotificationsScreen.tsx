import { memo } from "react"
import { Button, Stack } from "@mui/material"
import { Page } from "../../common/Page"
import { EmptyAlert } from "../../common/alerts/EmptyAlert"
import { FetchErrorAlert } from "../../common/alerts/FetchErrorAlert"
import { LoadingAlert } from "../../common/alerts/LoadingAlert"
import { UnavailableAlert } from "../../common/alerts/UnavailableAlert"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { useLocalNotifications } from "./useLocalNotifications"
import { LocalNotificationCard } from "./LocalNotificationCard"
import { useInboxNotifications } from "./useInboxNotifications"
import { useMarkAllNotificationsAsSeen } from "./useMarkAllNotificationsAsSeen"
import { useUnreadNotificationsCount } from "./useUnreadNotificationsCount"
import { NotificationCard } from "./NotificationCard"
import { PageContainer } from "../../common/PageContainer"
import { isQueryUnavailable } from "../../queries/isQueryUnavailable"

export const NotificationsScreen = memo(function NotificationsScreen() {
  const notificationsQuery = useInboxNotifications()
  const {
    data: notifications,
    isLoading: isInitialLoading,
    isError: hasError,
  } = notificationsQuery
  const { serverUnreadCount } = useUnreadNotificationsCount()
  const markAllNotificationsAsSeen = useMarkAllNotificationsAsSeen()
  const localNotifications = useLocalNotifications()
  const hasLocalNotifications = localNotifications.length > 0
  const isUnavailable = isQueryUnavailable(notificationsQuery)
  const canMarkAllRead =
    serverUnreadCount > 0 && !isUnavailable && !hasError && !isInitialLoading
  const isEmpty =
    notifications?.length === 0 && !isInitialLoading && !hasLocalNotifications

  return (
    <Page>
      <TopBarNavigation
        title="Notifications"
        rightComponent={
          <Button
            color="inherit"
            variant="text"
            onClick={() => {
              markAllNotificationsAsSeen.mutate(undefined)
            }}
            disabled={!canMarkAllRead || markAllNotificationsAsSeen.isPending}
          >
            Mark all read
          </Button>
        }
      />
      <PageContainer>
        <Stack
          sx={{
            py: 2,
            gap: 2,
          }}
        >
          {localNotifications.map((notification) => (
            <LocalNotificationCard
              key={notification.id}
              notification={notification}
            />
          ))}

          {isInitialLoading && <LoadingAlert subject="notifications" />}

          {hasError && <FetchErrorAlert subject="notifications" />}

          {isUnavailable && <UnavailableAlert subject="notifications" />}

          {isEmpty && <EmptyAlert subject="notifications" />}

          {notifications?.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
            />
          ))}
        </Stack>
      </PageContainer>
    </Page>
  )
})
