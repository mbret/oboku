import { memo } from "react"
import {
  ArchiveRounded,
  DoneRounded,
  LaunchRounded,
  NotificationsRounded,
} from "@mui/icons-material"
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material"
import type { NotificationSeverity, UserNotification } from "@oboku/shared"

const severityColorMap: Record<
  NotificationSeverity,
  "default" | "success" | "warning" | "error" | "info"
> = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "error",
}

const getCtaLabel = (notification: UserNotification) => {
  switch (notification.kind) {
    case "sync_finished":
      return "Open reports"
    case "admin_broadcast":
      return null
  }
}

export const NotificationCard = memo(function NotificationCard({
  notification,
  onMarkAsSeen,
  onOpenCta,
  onArchive,
  isMarkingAsSeen,
  isArchiving,
}: {
  notification: UserNotification
  onMarkAsSeen: (id: number) => void
  onOpenCta: (notification: UserNotification) => void
  onArchive: (id: number) => void
  isMarkingAsSeen: boolean
  isArchiving: boolean
}) {
  const ctaLabel = getCtaLabel(notification)

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
                onMarkAsSeen(notification.id)
              }}
              disabled={isMarkingAsSeen}
            >
              Mark as read
            </Button>
          )}
          {ctaLabel && (
            <Button
              size="small"
              variant="contained"
              startIcon={<LaunchRounded />}
              onClick={() => {
                onOpenCta(notification)
              }}
              disabled={isMarkingAsSeen}
            >
              {ctaLabel}
            </Button>
          )}
          <Button
            size="small"
            color="inherit"
            variant="text"
            startIcon={<ArchiveRounded />}
            onClick={() => {
              onArchive(notification.id)
            }}
            disabled={isArchiving}
          >
            Archive
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
})
