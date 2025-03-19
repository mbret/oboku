import { createDialog } from "../common/dialogs/createDialog"
import { useNavigate } from "react-router"
import { map } from "rxjs"
import { useMutation$ } from "reactjrx"
import { ROUTES } from "../navigation/routes"

export const useCreateBackToBookDialog = () => {
  const navigate = useNavigate()

  return useMutation$({
    mutationFn: ({ bookId, title }: { bookId: string; title?: string }) =>
      createDialog({
        title: `Take me back to my book`,
        content: `You were reading "${title ?? `unknown`}" the last time you used this device. Do you want to go back to reading?`,
        cancellable: true,
      }).$.pipe(
        map(() => {
          navigate(ROUTES.READER.replace(":id", bookId))
        }),
      ),
  })
}
