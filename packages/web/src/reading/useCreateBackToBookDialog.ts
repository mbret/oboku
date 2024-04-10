import { SIGNAL_RESET, useMutation } from "reactjrx"
import { createDialog } from "../common/dialogs/createDialog"
import { useNavigate } from "react-router-dom"
import { ROUTES } from "../constants"
import { finalize, map } from "rxjs"
import { bookBeingReadStateSignal } from "./states"

export const useCreateBackToBookDialog = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ bookId, title }: { bookId: string; title?: string }) =>
      createDialog({
        title: `Take me back to my book`,
        content: `You were reading "${title ?? `unknown`}" the last time you used this device. Do you want to go back to reading?`,
        cancellable: true
      }).$.pipe(
        map(() => {
          navigate(ROUTES.READER.replace(":id", bookId))
        }),
        finalize(() => {
          bookBeingReadStateSignal.setValue(SIGNAL_RESET)
        })
      )
  })
}
