import { toastsSubject, type AppToast } from "./Toasts"
import { errorToMessage } from "../../errors/ErrorMessage"

export const notify = (notification: AppToast | "actionSuccess") => {
  if (notification === "actionSuccess") {
    toastsSubject.next({
      title: "Action successful",
      description: "Action successful",
      severity: "success",
    })
  } else {
    toastsSubject.next(notification)
  }
}

export const notifyError = (error: unknown) => {
  notify({
    title: "Error",
    description: errorToMessage(error),
    severity: "error",
  })
}

export * from "./Toasts"
