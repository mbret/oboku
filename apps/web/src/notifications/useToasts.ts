import { useCallback } from "react"
import { toastsSubject, type AppToast } from "./Toasts"
import { errorToMessage } from "../errors/ErrorMessage"

export const useToasts = () => {
  const notify = useCallback((notification: AppToast | "actionSuccess") => {
    if (notification === "actionSuccess") {
      toastsSubject.next({
        title: "Action successful",
        description: "Action successful",
        severity: "success",
      })
    } else {
      toastsSubject.next(notification)
    }
  }, [])

  const notifyError = useCallback(
    (error: unknown) => {
      notify({
        title: "Error",
        description: errorToMessage(error),
        severity: "error",
      })
    },
    [notify],
  )

  return { notify, notifyError }
}
