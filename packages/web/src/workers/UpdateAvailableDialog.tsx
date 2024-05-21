import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from "@mui/material"
import { FC, useEffect } from "react"
import { useLock } from "../common/BlockingBackdrop"
import { filter, first, fromEvent, tap } from "rxjs"
import { Report } from "../debug/report.shared"

export const UpdateAvailableDialog: FC<{
  serviceWorker?: ServiceWorker
}> = ({ serviceWorker }) => {
  const hasUpdate = !!serviceWorker
  const [lock] = useLock()

  useEffect(() => {
    if (import.meta.env.MODE === "development" && !!serviceWorker) {
      serviceWorker?.postMessage({ type: "SKIP_WAITING" })
      Report.warn("service worker updated")
    }
  }, [serviceWorker])

  if (import.meta.env.MODE === "development") return null

  return (
    <Dialog open={hasUpdate}>
      <DialogTitle>Yay! A new version is here</DialogTitle>
      <DialogContent>
        <DialogContentText>
          A new version of the app is available. To update you can click on
          "reload" button. (
          <b>This action is mandatory right now until release</b>)
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            if (!serviceWorker) return

            lock()

            fromEvent<MessageEvent>(navigator.serviceWorker, "message")
              .pipe(
                filter((event) => event.data === "SKIP_WAITING_READY"),
                first(),
                tap(() => {
                  window.location.reload()
                })
              )
              .subscribe()

            serviceWorker?.postMessage({ type: "SKIP_WAITING" })
          }}
          color="primary"
          autoFocus
        >
          Reload
        </Button>
      </DialogActions>
    </Dialog>
  )
}
