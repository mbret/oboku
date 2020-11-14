import React, { FC } from 'react'
import { BooksSelectionList } from '../books/BooksSelectionList'
import { Dialog, DialogTitle } from '@material-ui/core'
import { QueryOneSeriesBooksDocument, MutationAddSeriesToBookDocument, MutationRemoveSeriesToBookDocument } from '../generated/graphql'
import { useMutation, useQuery } from '@apollo/client'
import { useQueryGetBooks } from '../books/queries'

export const BooksSelectionDialog: FC<{
  onClose: () => void,
  open: boolean,
  seriesId: string,
}> = ({ onClose, open, seriesId }) => {
  const { data } = useQuery(QueryOneSeriesBooksDocument, { variables: { id: seriesId } })
  const { data: booksData } = useQueryGetBooks()
  const [addToBook] = useMutation(MutationAddSeriesToBookDocument)
  const [removeFromBook] = useMutation(MutationRemoveSeriesToBookDocument)
  const books = booksData || []
  const seriesBooks = data?.oneSeries?.books?.map(item => item?.id) || []

  const isSelected = (selectedId: string) => !!seriesBooks.find(id => id === selectedId)

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Books in the series</DialogTitle>
      <BooksSelectionList
        isSelected={isSelected}
        onItemClick={(bookId) => {
          if (isSelected(bookId)) {
            seriesId && removeFromBook({ variables: { id: bookId, series: [seriesId] } })
          } else{
            seriesId && addToBook({ variables: { id: bookId, series: [seriesId] } })
          }
        }}
        books={books}
      />
    </Dialog>
  )
}