import { makeVar, useMutation, useReactiveVar } from '@apollo/client';
import { Button, Dialog, DialogActions, DialogTitle } from '@material-ui/core';
import React, { FC, useEffect } from 'react';
import { MutationAddSeriesToBookDocument, MutationRemoveSeriesToBookDocument } from '../generated/graphql';
import { useQueryGetSeries } from '../series/queries';
import { SeriesSelectionList } from '../series/SeriesSelectionList';
import { useLazyBook } from './queries';

export const openManageBookSeriesDialog = makeVar<string | undefined>(undefined)

export const ManageBookSeriesDialog: FC<{}> = () => {
  const id = useReactiveVar(openManageBookSeriesDialog)
  const open = !!id
  const { data: getSeriesData } = useQueryGetSeries()
  const [getBook, { data: getBookData }] = useLazyBook()
  const [addToBook] = useMutation(MutationAddSeriesToBookDocument)
  const [removeFromBook] = useMutation(MutationRemoveSeriesToBookDocument)
  const series = getSeriesData?.series
  const bookSeries = getBookData?.book?.series

  useEffect(() => {
    id && getBook({ variables: { id } })
  }, [id, getBook])

  const isSelected = (id: string) => !!bookSeries?.find(item => item?.id === id)

  return (
    <Dialog
      onClose={() => openManageBookSeriesDialog(undefined)}
      open={open}
    >
      <DialogTitle>Series selection</DialogTitle>
      {series && <SeriesSelectionList
        series={series}
        isSelected={isSelected}
        onItemClick={seriesId => {
          if (isSelected(seriesId)) {
            id && removeFromBook({ variables: { id, series: [seriesId] } })
          } else{
            id && addToBook({ variables: { id, series: [seriesId] } })
          }
        }}
      />}
      <DialogActions>
        <Button onClick={() => openManageBookSeriesDialog(undefined)} color="primary" autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}