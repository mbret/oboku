import { useMutation$ } from "reactjrx"
import { from } from "rxjs"
import { useUpsertLink } from "../links/useUpsertLink"

export const useUpsertBookLink = ({ onSuccess }: { onSuccess: () => void }) => {
  const { mutateAsync: upsertLink } = useUpsertLink()

  return useMutation$({
    onSuccess,
    mutationFn: ({
      bookId,
      linkResourceId,
      linkType,
    }: {
      bookId: string
      linkResourceId: string
      linkType: string
    }) => {
      /**
       * All it's needed is a new link and its link to the book.
       * Middleware will make the link between them two
       */
      return from(
        upsertLink({
          bookId,
          resourceId: linkResourceId,
          type: linkType,
        }),
      )
    },
  })
}
