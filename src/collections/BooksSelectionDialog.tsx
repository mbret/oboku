import React, { FC } from 'react'
import { BooksSelectionList } from '../books/BooksSelectionList'
import { Dialog, DialogTitle } from '@material-ui/core'
import { QueryCollectionBookIdsDocument, MutationAddCollectionsToBookDocument, MutationRemoveCollectionsToBookDocument, QueryBooksDocument } from '../generated/graphql'
import { useMutation, useQuery } from '@apollo/client'

export const BooksSelectionDialog: FC<{
  onClose: () => void,
  open: boolean,
  collectionId: string,
}> = ({ onClose, open, collectionId }) => {
  const { data } = useQuery(QueryCollectionBookIdsDocument, { variables: { id: collectionId } })
  const { data: booksData } = useQuery(QueryBooksDocument)
  const [addToBook] = useMutation(MutationAddCollectionsToBookDocument)
  const [removeFromBook] = useMutation(MutationRemoveCollectionsToBookDocument)
  const books = booksData?.books || []
  const collectionBooks = data?.collection?.books?.map(item => item?.id) || []

  const isSelected = (selectedId: string) => !!collectionBooks.find(id => id === selectedId)

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Books in the collection</DialogTitle>
      <BooksSelectionList
        isSelected={isSelected}
        onItemClick={(bookId) => {
          if (isSelected(bookId)) {
            collectionId && removeFromBook({ variables: { id: bookId, collections: [collectionId] } })
          } else{
            collectionId && addToBook({ variables: { id: bookId, collections: [collectionId] } })
          }
        }}
        books={books}
      />
    </Dialog>
  )
}