import { FC, useMemo } from "react"
import { useRemoveTagFromBook, useAddTagToBook } from "../books/helpers"
import { atom, useRecoilState, useRecoilValue } from "recoil"
import { booksAsArrayState } from "../books/states"
import { useCallback } from "react"
import { BooksSelectionDialog } from "../books/BooksSelectionDialog"
import { useDatabase } from "../rxdb"
import { useTag } from "./states"

export const isManageTagBooksDialogOpenedWithState = atom<string | undefined>({
  key: "isManageTagBooksDialogOpenedWith",
  default: undefined
})

export const ManageTagBooksDialog: FC<{}> = () => {
  const [
    isManageTagBooksDialogOpenedWith,
    setIsManageTagBooksDialogOpenedWith
  ] = useRecoilState(isManageTagBooksDialogOpenedWithState)
  const { db$ } = useDatabase()
  const tag = useTag(db$, isManageTagBooksDialogOpenedWith || "-1")
  const books = useRecoilValue(booksAsArrayState)
  const addTagToBook = useAddTagToBook()
  const removeFromBook = useRemoveTagFromBook()
  const tagBooks = useMemo(() => tag?.books?.map((item) => item) || [], [tag])
  const tagId = isManageTagBooksDialogOpenedWith

  const onClose = () => {
    setIsManageTagBooksDialogOpenedWith(undefined)
  }

  const data = useMemo(
    () =>
      books.map((item) => ({
        id: item._id,
        selected: !!tagBooks.find((id) => id === item._id)
      })),
    [books, tagBooks]
  )

  const onItemClick = useCallback(
    ({ id: bookId, selected }: { id: string; selected: boolean }) => {
      if (selected) {
        tagId && removeFromBook({ bookId, tagId })
      } else {
        tagId && addTagToBook({ _id: bookId, tagId })
      }
    },
    [removeFromBook, addTagToBook, tagId]
  )

  return (
    <BooksSelectionDialog
      open={!!tagId}
      onClose={onClose}
      data={data}
      onItemClick={onItemClick}
    />
  )
}
