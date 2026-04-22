import { memo } from "react"
import { useParams } from "react-router"
import { useMutation } from "@tanstack/react-query"
import { BookSelectionPage } from "../../../../books/BookSelectionPage"
import {
  useAddCollectionToBook,
  useRemoveCollectionFromBook,
} from "../../../../books/helpers"
import { useCollection } from "../../../../collections/useCollection"
import { useCollectionComputedMetadata } from "../../../../collections/useCollectionComputedMetadata"
import { notify, notifyError } from "../../../../notifications/toasts"
import { NotFoundPage } from "../../../../common/NotFoundPage"

type ScreenParams = {
  id: string
}

export const CollectionBooksScreen = memo(function CollectionBooksScreen() {
  const { id: collectionId } = useParams<ScreenParams>()
  const { data: collection } = useCollection({ id: collectionId })
  const metadata = useCollectionComputedMetadata(collection)
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

  if (collection === null) return <NotFoundPage />

  return (
    <BookSelectionPage
      title={`Manage ${metadata.title} books`}
      persistedBookIds={collection?.books}
      isSaving={isSaving}
      onSave={save}
    />
  )
})
