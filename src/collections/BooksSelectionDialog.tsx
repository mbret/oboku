import React, { FC } from 'react'
import { BooksSelectionList } from '../books/BooksSelectionList'
import { Dialog, DialogTitle } from '@material-ui/core'
import { useRemoveCollectionFromBook, useAddCollectionToBook } from '../books/helpers'
import { useRecoilValue } from 'recoil'
import { booksAsArrayState } from '../books/states'
import { normalizedCollectionsState } from './states'

export const BooksSelectionDialog: FC<{
  onClose: () => void,
  open: boolean,
  collectionId: string,
}> = ({ onClose, open, collectionId }) => {
  const collection = useRecoilValue(normalizedCollectionsState)[collectionId || '-1']
  const books = useRecoilValue(booksAsArrayState)
  const [addToBook] = useAddCollectionToBook()
  const [removeFromBook] = useRemoveCollectionFromBook()
  const collectionBooks = collection?.books?.map(item => item) || []

  const isSelected = (selectedId: string) => !!collectionBooks.find(id => id === selectedId)

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Books in the collection</DialogTitle>
      <BooksSelectionList
        isSelected={isSelected}
        onItemClick={(bookId) => {
          if (isSelected(bookId)) {
            collectionId && removeFromBook({ _id: bookId, collectionId })
          } else {
            collectionId && addToBook({ _id: bookId, collectionId })
          }
        }}
        books={books}
      />
    </Dialog>
  )
}