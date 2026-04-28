import { memo } from "react"
import { useParams } from "react-router"
import { useMutation } from "@tanstack/react-query"
import { useSignalValue } from "reactjrx"
import { BookSelectionView } from "../../../../books/BookSelectionView"
import {
  useAddCollectionToBook,
  useRemoveCollectionFromBook,
} from "../../../../books/helpers"
import { useCollection } from "../../../../collections/useCollection"
import { useCollectionComputedMetadata } from "../../../../collections/useCollectionComputedMetadata"
import { useIsCollectionProtected } from "../../../../collections/useIsCollectionProtected"
import { notify, notifyError } from "../../../../notifications/toasts"
import { NotFoundPage } from "../../../../common/NotFoundPage"
import { Page } from "../../../../common/Page"
import { TopBarNavigation } from "../../../../navigation/TopBarNavigation"
import {
  libraryStateSignal,
  selectIsLibraryUnlocked,
} from "../../../../library/books/states"
import { ProtectedContentGuard } from "../../../../library/ProtectedContentGuard"

type ScreenParams = {
  id: string
}

export const CollectionBooksScreen = memo(function CollectionBooksScreen() {
  const { id: collectionId } = useParams<ScreenParams>()
  const { data: collection } = useCollection({ id: collectionId })
  const metadata = useCollectionComputedMetadata(collection)
  const { data: isCollectionProtected } = useIsCollectionProtected(collection)
  const isLibraryUnlocked = useSignalValue(
    libraryStateSignal,
    selectIsLibraryUnlocked,
  )
  const { mutateAsync: addCollectionToBook } = useAddCollectionToBook()
  const { mutateAsync: removeCollectionFromBook } =
    useRemoveCollectionFromBook()

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: async ({
      toAdd,
      toRemove,
    }: {
      toAdd: string[]
      toRemove: string[]
    }) => {
      if (!collectionId) return
      await Promise.all([
        ...toAdd.map((bookId) =>
          addCollectionToBook({ _id: bookId, collectionId }),
        ),
        ...toRemove.map((bookId) =>
          removeCollectionFromBook({ _id: bookId, collectionId }),
        ),
      ])
    },
    onSuccess: () => {
      notify("actionSuccess")
    },
    onError: notifyError,
  })

  if (!collectionId || collection === null) return <NotFoundPage />

  /**
   * A collection is protected when at least one of its books carries a
   * protected tag. While the library is locked, `useBooks()` filters
   * those books out, so the management screen would silently operate on
   * a partial set (hidden persisted selection, misleading counters,
   * partial saves). Gate the screen behind a global unlock until we
   * confirm the collection is fully visible.
   */
  const isLocked = !!isCollectionProtected && !isLibraryUnlocked

  return (
    <Page sx={{ overflow: "hidden" }} bottomGutter={false}>
      <TopBarNavigation title={`Manage ${metadata.title} books`} showBack />
      {isLocked ? (
        <ProtectedContentGuard
          title="This collection contains protected books"
          description="Unlock protected contents to view and manage every book in this collection."
        />
      ) : (
        <BookSelectionView
          persistedBookIds={collection?.books}
          entityKey={collectionId}
          isSaving={isSaving}
          onSave={save}
        />
      )}
    </Page>
  )
})
