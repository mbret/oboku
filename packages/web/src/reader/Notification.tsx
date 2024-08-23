import { Snackbar } from "@mui/material"
import { memo } from "react"
import {
  delay,
  distinctUntilChanged,
  map,
  merge,
  of,
  skip,
  switchMap,
  throttleTime
} from "rxjs"
import {
  READER_NOTIFICATION_THROTTLE_TIME,
  READER_NOTIFICATION_TIME_TO_SCREEN
} from "../constants"
import { reader$ } from "./states"
import { useForeverQuery } from "reactjrx"

type Notification = {
  message: string
}

const useNotification = () =>
  useForeverQuery({
    networkMode: "always",
    queryKey: ["notification"],
    queryFn: () =>
      reader$.pipe(
        switchMap((reader) => {
          const fontChangeNotification$ = reader.settings.values$.pipe(
            map(({ fontScale }) => fontScale),
            distinctUntilChanged(),
            skip(1),
            map(
              (fontScale): Notification => ({
                message: `Font scale changed to ${fontScale.toFixed(2)}`
              })
            )
          )

          return fontChangeNotification$
        }),
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
      message={notification?.message}
    />
  )
})
