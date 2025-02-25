import { useEffect } from "react"
import screenfull from "screenfull"
import { Report } from "../../debug/report.shared"
import {
  EMPTY,
  catchError,
  defer,
  from,
  mergeMap,
  retry,
  throwError,
  timer,
} from "rxjs"
import { useSubscribe } from "reactjrx"
import { createDialog } from "../dialogs/createDialog"
import { CancelError } from "../../errors/errors.shared"

const isPermissionCheckFailedError = (error: unknown): error is TypeError =>
  error instanceof TypeError &&
  // chrome
  (error.message === "Permissions check failed" ||
    // safari
    error.message === "Type error" ||
    // firefox
    error.message === "Fullscreen request denied")

export const useFullscreenOnMount = ({ enabled }: { enabled: boolean }) => {
  useSubscribe(() => {
    if (enabled && screenfull.isEnabled && !screenfull.isFullscreen) {
      return defer(() => {
        return from(screenfull.request(undefined, { navigationUI: "hide" }))
      }).pipe(
        retry({
          count: 1,
          delay: (error) => {
            if (isPermissionCheckFailedError(error)) {
              return timer(5).pipe(
                mergeMap(() =>
                  // we avoid double dialog because of strict mode
                  screenfull.isFullscreen
                    ? throwError(() => error)
                    : createDialog({
                        title: "Fullscreen request",
                        content:
                          "Your browser does not allow automatic fullscreen without an interaction",
                        confirmTitle: "Fullscreen",
                        cancellable: true,
                      }).$,
                ),
              )
            }

            throw error
          },
        }),
        catchError((error) => {
          if (
            isPermissionCheckFailedError(error) ||
            error instanceof CancelError
          ) {
            return EMPTY
          }

          Report.error(error)

          return EMPTY
        }),
      )
    }

    return EMPTY
  }, [enabled])

  useEffect(() => {
    return () => {
      if (screenfull.isEnabled && screenfull.isFullscreen) {
        screenfull.exit().catch(Report.error)
      }
    }
  }, [])
}
