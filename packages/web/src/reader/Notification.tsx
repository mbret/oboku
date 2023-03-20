import { Snackbar } from "@mui/material"
import { bind } from "@react-rxjs/core"
import { memo } from "react"
import { delay, merge, of, switchMap, throttleTime } from "rxjs"
import {
  READER_NOTIFICATION_THROTTLE_TIME,
  READER_NOTIFICATION_TIME_TO_SCREEN
} from "../constants"
import { reader$ } from "./states"

const [useNotification] = bind(
  reader$.pipe(
    switchMap((reader) => reader.hammerGesture.changes$),
    throttleTime(READER_NOTIFICATION_THROTTLE_TIME, undefined, {
      leading: false,
      trailing: true
    }),
    switchMap((notification) =>
      merge(
        of(notification),
        of(undefined).pipe(delay(READER_NOTIFICATION_TIME_TO_SCREEN))
      )
    )
  ),
  undefined
)

export const Notification = memo(() => {
  const notification = useNotification()

  return (
    <Snackbar
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      open={!!notification}
      message={`Font scale changed to ${notification?.value.toFixed(2)}`}
    />
  )
})
