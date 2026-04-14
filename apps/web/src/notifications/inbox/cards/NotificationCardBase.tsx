import { type ReactNode, memo } from "react"
import { DeleteRounded } from "@mui/icons-material"
import {
  Alert,
  AlertTitle,
  Button,
  IconButton,
  Stack,
  Typography,
} from "@mui/material"
import type { UserNotification } from "@oboku/shared"
import { MarkAsReadIcon } from "../../../common/icon"
import { useMarkNotificationAsSeen } from "../useMarkNotificationAsSeen"
import { useArchiveNotification } from "../useArchiveNotification"

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
    <Alert
      severity={notification.severity}
      style={{ opacity: notification.seenAt ? 0.6 : 1 }}
      sx={{ "& .MuiAlert-message": { flexGrow: 1 } }}
      action={
        <IconButton
          size="small"
          color="inherit"
          aria-label="archive"
          onClick={() => {
            archive.mutate({ id: notification.id })
          }}
          disabled={archive.isPending}
        >
          <DeleteRounded fontSize="small" />
        </IconButton>
      }
    >
      <AlertTitle>{notification.title}</AlertTitle>
      <Stack gap={1} mb={1}>
        <Typography variant="caption" color="text.secondary">
          {new Date(notification.createdAt).toLocaleString()}
        </Typography>
        {notification.body}
      </Stack>
      <Stack
        direction="row"
        gap={1}
        flexWrap="wrap-reverse"
        justifyContent="space-between"
        alignItems="center"
      >
        {!notification.seenAt ? (
          <Button
            size="small"
            variant="text"
            startIcon={<MarkAsReadIcon />}
            onClick={() => {
              markAsSeen.mutate({ id: notification.id })
            }}
            disabled={markAsSeen.isPending}
          >
            Mark as read
          </Button>
        ) : (
          <span />
        )}
        {cta}
      </Stack>
    </Alert>
  )
})
