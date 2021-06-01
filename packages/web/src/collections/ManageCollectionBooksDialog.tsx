import { FC } from 'react'
import { useRemoveCollectionFromBook, useAddCollectionToBook } from '../books/helpers'
import { useRecoilValue } from 'recoil'
import { booksAsArrayState } from '../books/states'
import { collectionState } from './states'
import { useMemo } from 'react'
import { useCallback } from 'react'
import { BooksSelectionDialog } from '../books/BooksSelectionDialog'

export const ManageCollectionBooksDialog: FC<{
  onClose: () => void,
  open: boolean,
  collectionId: string,
}> = ({ onClose, open, collectionId }) => {
  const collection = useRecoilValue(collectionState(collectionId || '-1'))
  const books = useRecoilValue(booksAsArrayState)
  const [addToBook] = useAddCollectionToBook()
  const [removeFromBook] = useRemoveCollectionFromBook()
  const collectionBooks = useMemo(() => collection?.books?.map(item => item) || [], [collection])

  const data = useMemo(() => books.map(item => ({
    id: item._id,
    selected: !!collectionBooks.find(id => id === item._id)
  })), [books, collectionBooks])

  const onItemClick = useCallback(({ id: bookId, selected }: { id: string, selected: boolean }) => {
    if (selected) {
      collectionId && removeFromBook({ _id: bookId, collectionId })
    } else {
      collectionId && addToBook({ _id: bookId, collectionId })
    }
  }, [collectionId, addToBook, removeFromBook])

  return (
    <BooksSelectionDialog
      open={open}
      onClose={onClose}
      onItemClick={onItemClick}
      data={data}
    />
  )
}