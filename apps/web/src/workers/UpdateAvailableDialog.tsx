import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link,
} from "@mui/material"
import type { FC } from "react"
import { useLock } from "../common/BlockingBackdrop"
import { WebCommunication } from "./communication/communication.web"
import { SkipWaitingMessage } from "./communication/types.shared"

export const UpdateAvailableDialog: FC<{
  serviceWorker?: ServiceWorker
}> = ({ serviceWorker }) => {
  const hasUpdate = !!serviceWorker
  const [lock] = useLock()

  if (import.meta.env.MODE === "development") return null

  return (
    <Dialog open={hasUpdate}>
      <DialogTitle>Yay! A new version is here</DialogTitle>
      <DialogContent>
        <DialogContentText>
          A new version of the app is available. (
          <b>This action is mandatory right now until release</b>). See the full{" "}
          <Link href="https://docs.oboku.me/changelog" target="_blank">
            changelog here.
          </Link>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            if (!serviceWorker) return

            lock()

            WebCommunication.sendMessage(
              serviceWorker,
              new SkipWaitingMessage(),
            )
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
