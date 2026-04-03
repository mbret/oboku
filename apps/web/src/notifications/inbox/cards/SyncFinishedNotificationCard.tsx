import { memo } from "react"
import { LaunchRounded } from "@mui/icons-material"
import { Button } from "@mui/material"
import type { UserNotification } from "@oboku/shared"
import { useNavigate } from "react-router"
import { ROUTES } from "../../../navigation/routes"
import { useMarkNotificationAsSeen } from "../useMarkNotificationAsSeen"
import { NotificationCardBase } from "./NotificationCardBase"

type SyncFinishedNotification = Extract<
  UserNotification,
  { kind: "sync_finished" }
>

export const SyncFinishedNotificationCard = memo(
  function SyncFinishedNotificationCard({
    notification,
  }: {
    notification: SyncFinishedNotification
  }) {
    const navigate = useNavigate()
    const markAsSeen = useMarkNotificationAsSeen()

    const openReports = async () => {
      if (!notification.seenAt) {
        await markAsSeen.mutateAsync({ id: notification.id })
      }

      navigate(ROUTES.SYNC_REPORTS)
    }

    return (
      <NotificationCardBase
        notification={notification}
        cta={
          <Button
            size="small"
            variant="contained"
            startIcon={<LaunchRounded />}
            onClick={() => {
              void openReports()
            }}
            disabled={markAsSeen.isPending}
          >
            Open reports
          </Button>
        }
      />
    )
  },
)
