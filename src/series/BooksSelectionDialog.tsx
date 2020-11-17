import React, { FC } from 'react'
import { BooksSelectionList } from '../books/BooksSelectionList'
import { Dialog, DialogTitle } from '@material-ui/core'
import { QueryOneSeriesBookIdsDocument, MutationAddSeriesToBookDocument, MutationRemoveSeriesToBookDocument, QueryBookIdsDocument } from '../generated/graphql'
import { useMutation, useQuery } from '@apollo/client'

export const BooksSelectionDialog: FC<{
  onClose: () => void,
  open: boolean,
  seriesId: string,
}> = ({ onClose, open, seriesId }) => {
  const { data } = useQuery(QueryOneSeriesBookIdsDocument, { variables: { id: seriesId } })
  const { data: booksData } = useQuery(QueryBookIdsDocument)
  const [addToBook] = useMutation(MutationAddSeriesToBookDocument)
  const [removeFromBook] = useMutation(MutationRemoveSeriesToBookDocument)
  const books = booksData?.books || []
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