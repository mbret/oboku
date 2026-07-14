import { memo } from "react"
import { LoginRounded } from "@mui/icons-material"
import { Alert, AlertTitle, Button, Stack } from "@mui/material"
import { Link, useLocation } from "react-router"
import type { LocalNotification } from "./useLocalNotifications"
import type { FromLocationState } from "../../navigation/locationState"

export const LocalNotificationCard = memo(function LocalNotificationCard({
  notification,
}: {
  notification: LocalNotification
}) {
  const location = useLocation()

  return (
    <Alert
      severity={notification.severity}
      sx={{ "& .MuiAlert-message": { flexGrow: 1 } }}
    >
      <AlertTitle>{notification.title}</AlertTitle>
      <Stack
        sx={{
          gap: 1,
          alignItems: "flex-start",
        }}
      >
        {notification.body}
        {notification.action ? (
          <Button
            component={Link}
            to={notification.action.to}
            state={{ from: location.pathname } satisfies FromLocationState}
            size="small"
            variant="contained"
            startIcon={<LoginRounded />}
          >
            {notification.action.label}
          </Button>
        ) : null}
      </Stack>
    </Alert>
  )
})
