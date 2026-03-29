import { useMutation$ } from "reactjrx"
import { from } from "rxjs"
import { useUpsertLink } from "../links/useUpsertLink"
import type { DataSourceDocType, LinkData } from "@oboku/shared"

export const useUpsertBookLink = ({ onSuccess }: { onSuccess: () => void }) => {
  const { mutateAsync: upsertLink } = useUpsertLink()

  return useMutation$({
    onSuccess,
    mutationFn: ({
      bookId,
      linkData,
      linkType,
    }: {
      bookId: string
      linkData: LinkData
      linkType: DataSourceDocType["type"]
    }) => {
      return from(
        upsertLink({
          bookId,
          data: linkData,
          type: linkType,
        }),
      )
    },
  })
}
