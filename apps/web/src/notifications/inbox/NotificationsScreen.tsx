import { memo } from "react"
import {
  ArchiveRounded,
  DoneRounded,
  LaunchRounded,
  NotificationsRounded,
} from "@mui/icons-material"
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material"
import type { NotificationSeverity, UserNotification } from "@oboku/shared"
import { useNavigate } from "react-router"
import { Page } from "../../common/Page"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { ROUTES } from "../../navigation/routes"
import {
  useArchiveNotification,
  useInboxNotifications,
  useMarkAllNotificationsAsSeen,
  useMarkNotificationAsSeen,
  useUnreadNotificationsCount,
} from "./useInboxNotifications"

const severityColorMap: Record<
  NotificationSeverity,
  "default" | "success" | "warning" | "error" | "info"
> = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "error",
}

const getNotificationCtaLabel = (notification: UserNotification) => {
  switch (notification.kind) {
    case "sync_finished":
      return "Open reports"
    case "admin_broadcast":
      return null
  }
}

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
          <Paper
            variant="outlined"
            key={notification.id}
            style={{ opacity: notification.seenAt ? 0.6 : 1 }}
          >
            <Stack p={2} gap={1.5}>
              <Stack direction="row" justifyContent="space-between" gap={1}>
                <Box>
                  <Stack direction="row" gap={1} alignItems="center" mb={0.5}>
                    <NotificationsRounded color="action" fontSize="small" />
                    <Typography fontWeight={600}>
                      {notification.title}
                    </Typography>
                    {!notification.seenAt && (
                      <Chip
                        size="small"
                        label="Unread"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(notification.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={notification.severity}
                  color={severityColorMap[notification.severity]}
                  variant="outlined"
                />
              </Stack>
              {notification.body && (
                <Typography variant="body2" whiteSpace="pre-wrap">
                  {notification.body}
                </Typography>
              )}
              <Stack direction="row" gap={1} flexWrap="wrap">
                {!notification.seenAt && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DoneRounded />}
                    onClick={() => {
                      markNotificationAsSeen.mutate({ id: notification.id })
                    }}
                    disabled={markNotificationAsSeen.isPending}
                  >
                    Mark as read
                  </Button>
                )}
                {getNotificationCtaLabel(notification) && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<LaunchRounded />}
                    onClick={() => {
                      void openNotificationCta(notification)
                    }}
                    disabled={markNotificationAsSeen.isPending}
                  >
                    {getNotificationCtaLabel(notification)}
                  </Button>
                )}
                <Button
                  size="small"
                  color="inherit"
                  variant="text"
                  startIcon={<ArchiveRounded />}
                  onClick={() => {
                    archiveNotification.mutate({ id: notification.id })
                  }}
                  disabled={archiveNotification.isPending}
                >
                  Archive
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Page>
  )
})
