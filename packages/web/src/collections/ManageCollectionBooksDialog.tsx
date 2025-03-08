import {
  useRemoveCollectionFromBook,
  useAddCollectionToBook,
} from "../books/helpers"
import { useBooks } from "../books/states"
import { memo, useMemo } from "react"
import { useCallback } from "react"
import { BooksSelectionDialog } from "../books/BooksSelectionDialog"
import { useCollection } from "./useCollection"

export const ManageCollectionBooksDialog = memo(
  ({
    onClose,
    open,
    collectionId,
  }: {
    onClose: () => void
    open: boolean
    collectionId?: string
  }) => {
    const { data: collection } = useCollection({
      id: collectionId,
    })
    const { data: books } = useBooks({
      enabled: open,
      subscribed: open,
    })
    const { mutate: addToBook } = useAddCollectionToBook()
    const { mutate: removeFromBook } = useRemoveCollectionFromBook()

    const data = useMemo(() => books?.map((item) => item._id) || [], [books])

    const selected = useMemo(
      () =>
        books?.reduce(
          (acc, item) => ({
            ...acc,
            [item._id]: !!collection?.books?.find((id) => id === item._id),
          }),
          {} as Record<string, boolean>,
        ) || {},
      [books, collection],
    )

    const onItemClick = useCallback(
      ({ id: bookId, selected }: { id: string; selected: boolean }) => {
        if (selected) {
          collectionId && removeFromBook({ _id: bookId, collectionId })
        } else {
          collectionId && addToBook({ _id: bookId, collectionId })
        }
      },
      [collectionId, addToBook, removeFromBook],
    )

    return (
      <BooksSelectionDialog
        open={open}
        onClose={onClose}
        onItemClick={onItemClick}
        data={data}
        selected={selected}
      />
    )
  },
)
