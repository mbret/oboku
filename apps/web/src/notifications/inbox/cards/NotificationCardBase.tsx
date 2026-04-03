import { type ReactNode, memo } from "react"
import {
  ArchiveRounded,
  DoneRounded,
  NotificationsRounded,
} from "@mui/icons-material"
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material"
import type { NotificationSeverity, UserNotification } from "@oboku/shared"
import { useMarkNotificationAsSeen } from "../useMarkNotificationAsSeen"
import { useArchiveNotification } from "../useArchiveNotification"

const severityColorMap: Record<
  NotificationSeverity,
  "default" | "success" | "warning" | "error" | "info"
> = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "error",
}

export const NotificationCardBase = memo(function NotificationCardBase({
  notification,
  cta,
}: {
  notification: UserNotification
  cta?: ReactNode
}) {
  const markAsSeen = useMarkNotificationAsSeen()
  const archive = useArchiveNotification()

  return (
    <Paper
      variant="outlined"
      style={{ opacity: notification.seenAt ? 0.6 : 1 }}
    >
      <Stack p={2} gap={1.5}>
        <Stack direction="row" justifyContent="space-between" gap={1}>
          <Box>
            <Stack direction="row" gap={1} alignItems="center" mb={0.5}>
              <NotificationsRounded color="action" fontSize="small" />
              <Typography fontWeight={600}>{notification.title}</Typography>
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
                markAsSeen.mutate({ id: notification.id })
              }}
              disabled={markAsSeen.isPending}
            >
              Mark as read
            </Button>
          )}
          {cta}
          <Button
            size="small"
            color="inherit"
            variant="text"
            startIcon={<ArchiveRounded />}
            onClick={() => {
              archive.mutate({ id: notification.id })
            }}
            disabled={archive.isPending}
          >
            Archive
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
})
