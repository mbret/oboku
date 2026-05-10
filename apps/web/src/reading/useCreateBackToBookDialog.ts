import { useNavigate } from "react-router"
import { map } from "rxjs"
import { useMutation$ } from "reactjrx"
import { ROUTES } from "../navigation/routes"
import { fromCreateDialog } from "../common/dialogs/fromCreateDialog"

export const useCreateBackToBookDialog = () => {
  const navigate = useNavigate()

  return useMutation$({
    mutationFn: ({ bookId, title }: { bookId: string; title?: string }) =>
      fromCreateDialog({
        title: `Take me back to my book`,
        message: `You were reading "${title ?? `unknown`}" the last time you used this device. Do you want to go back to reading?`,
        cancellable: true,
      }).pipe(
        map(() => {
          navigate(ROUTES.READER.replace(":id", bookId))
        }),
      ),
  })
}
