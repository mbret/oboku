import { memo } from "react"
import { useParams } from "react-router"
import { useMutation } from "@tanstack/react-query"
import { BookSelectionPage } from "../../../../../books/BookSelectionPage"
import {
  useAddTagToBook,
  useRemoveTagFromBook,
} from "../../../../../books/helpers"
import { useTag } from "../../../../../tags/helpers"
import { notify, notifyError } from "../../../../../notifications/toasts"
import { NotFoundPage } from "../../../../../common/NotFoundPage"

type ScreenParams = {
  id: string
}

export const TagBooksScreen = memo(function TagBooksScreen() {
  const { id: tagId } = useParams<ScreenParams>()
  const { data: tag } = useTag(tagId)
  const { mutateAsync: addTagToBook } = useAddTagToBook()
  const { mutateAsync: removeTagFromBook } = useRemoveTagFromBook()

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: async ({
      toAdd,
      toRemove,
    }: {
      toAdd: string[]
      toRemove: string[]
    }) => {
      if (!tagId) return
      await Promise.all([
        ...toAdd.map((bookId) => addTagToBook({ _id: bookId, tagId })),
        ...toRemove.map((bookId) => removeTagFromBook({ _id: bookId, tagId })),
      ])
    },
    onSuccess: () => {
      notify("actionSuccess")
    },
    onError: notifyError,
  })

  if (!tagId || tag === null) return <NotFoundPage />

  return (
    <BookSelectionPage
      title={`Manage ${tag?.name ?? ""} books`}
      persistedBookIds={tag?.books}
      entityKey={tagId}
      isSaving={isSaving}
      onSave={save}
    />
  )
})
