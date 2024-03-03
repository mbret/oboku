import { Snackbar } from "@mui/material"
import { memo } from "react"
import { delay, filter, merge, of, switchMap, throttleTime } from "rxjs"
import {
  READER_NOTIFICATION_THROTTLE_TIME,
  READER_NOTIFICATION_TIME_TO_SCREEN
} from "../constants"
import { readerStateSignal } from "./states"
import { isDefined, useForeverQuery } from "reactjrx"

const useNotification = () =>
  useForeverQuery({
    networkMode: "always",
    queryKey: ["notification"],
    queryFn: () =>
      readerStateSignal.subject.pipe(
        filter(isDefined),
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
      )
  })

export const Notification = memo(() => {
  const { data: notification } = useNotification()

  return (
    <Snackbar
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      open={!!notification}
      message={`Font scale changed to ${notification?.value.toFixed(2)}`}
    />
  )
})
