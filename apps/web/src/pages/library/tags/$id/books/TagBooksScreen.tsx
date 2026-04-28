import { memo } from "react"
import { useParams } from "react-router"
import { useMutation } from "@tanstack/react-query"
import { useSignalValue } from "reactjrx"
import { BookSelectionView } from "../../../../../books/BookSelectionView"
import {
  useAddTagToBook,
  useRemoveTagFromBook,
} from "../../../../../books/helpers"
import { useTag } from "../../../../../tags/helpers"
import { notify, notifyError } from "../../../../../notifications/toasts"
import { NotFoundPage } from "../../../../../common/NotFoundPage"
import { Page } from "../../../../../common/Page"
import { TopBarNavigation } from "../../../../../navigation/TopBarNavigation"
import {
  libraryStateSignal,
  selectIsLibraryUnlocked,
} from "../../../../../library/books/states"
import { ProtectedContentGuard } from "../../../../../library/ProtectedContentGuard"

type ScreenParams = {
  id: string
}

export const TagBooksScreen = memo(function TagBooksScreen() {
  const { id: tagId } = useParams<ScreenParams>()
  const { data: tag } = useTag(tagId)
  const isLibraryUnlocked = useSignalValue(
    libraryStateSignal,
    selectIsLibraryUnlocked,
  )
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

  /**
   * Managing a protected tag while the library is locked is a footgun:
   * `useBooks()` filters protected books out, so the persisted selection
   * (which comes from `tag.books` and includes protected ids) ends up
   * partially invisible — counters, "select all", and saves all operate
   * on the visible slice only. Gate the screen behind a global unlock
   * so the user manages the full set or nothing.
   */
  const isLocked = !!tag?.isProtected && !isLibraryUnlocked

  return (
    <Page sx={{ overflow: "hidden" }} bottomGutter={false}>
      <TopBarNavigation title={`Manage ${tag?.name ?? ""} books`} showBack />
      {isLocked ? (
        <ProtectedContentGuard
          title="This tag is protected"
          description="Unlock protected contents to view and manage every book in this tag."
        />
      ) : (
        <BookSelectionView
          persistedBookIds={tag?.books}
          entityKey={tagId}
          isSaving={isSaving}
          onSave={save}
        />
      )}
    </Page>
  )
})
