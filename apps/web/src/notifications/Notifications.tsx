import { memo } from "react"
import { useObserve } from "reactjrx"
import { concatMap, map, merge, of, Subject, timer } from "rxjs"
import { Alert, Snackbar } from "@mui/material"

export type AppNotification = {
  title: string
  description: string
  duration?: number
  severity?: "error" | "warning" | "info" | "success"
}

export const notificationsSubject = new Subject<AppNotification>()

export const Notifications = memo(() => {
  const notification = useObserve(
    () =>
      notificationsSubject.pipe(
        concatMap((notification) => {
          const duration = notification.duration ?? 4000

          return merge(of(notification), timer(duration).pipe(map(() => null)))
        }),
      ),
    [],
  )

  const hasSeverity = typeof notification?.severity === "string"

  if (hasSeverity) {
    return (
      <Snackbar open={!!notification} message={notification?.title}>
        <Alert severity={notification.severity ?? "info"}>
          {notification.description}
        </Alert>
      </Snackbar>
    )
  }
  return <Snackbar open={!!notification} message={notification?.title} />
})
