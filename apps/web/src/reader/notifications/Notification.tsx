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
  throttleTime,
} from "rxjs"
import { reader$ } from "../states"
import { useQuery$ } from "reactjrx"
import { configuration } from "../../config/configuration"

type Notification = {
  message: string
}

const useNotification = () =>
  useQuery$({
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
                message: `Font scale changed to ${fontScale.toFixed(2)}`,
              }),
            ),
          )

          return fontChangeNotification$
        }),
        throttleTime(
          configuration.READER_NOTIFICATION_THROTTLE_TIME,
          undefined,
          {
            leading: false,
            trailing: true,
          },
        ),
        switchMap((notification) =>
          merge(
            of(notification),
            of(undefined).pipe(
              delay(configuration.READER_NOTIFICATION_TIME_TO_SCREEN),
            ),
          ),
        ),
      ),
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
