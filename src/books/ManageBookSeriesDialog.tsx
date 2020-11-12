import { makeVar, useReactiveVar } from '@apollo/client';
import { Button, Dialog, DialogActions, DialogTitle, List, ListItem, ListItemAvatar, ListItemText } from '@material-ui/core';
import { CheckCircleRounded, RadioButtonUncheckedOutlined } from '@material-ui/icons';
import React, { FC, useEffect } from 'react';
import { useQueryGetSeries } from '../series/queries';
import { useEditBook, useLazyBook } from './queries';

export const openManageBookSeriesDialog = makeVar<string | undefined>(undefined)

export const ManageBookSeriesDialog: FC<{}> = () => {
  const id = useReactiveVar(openManageBookSeriesDialog)
  const open = !!id
  const { data: getSeriesData } = useQueryGetSeries()
  const [getBook, { data: getBookData }] = useLazyBook()
  const editBook = useEditBook()
  const series = getSeriesData?.series
  const bookSeries = getBookData?.book?.series
  const currentBookSeriesIds = bookSeries?.map(item => item?.id || '-1') || []

  useEffect(() => {
    id && getBook({ variables: { id } })
  }, [id, getBook])

  return (
    <Dialog
      onClose={() => openManageBookSeriesDialog(undefined)}
      open={open}
    >
      <DialogTitle>Series selection</DialogTitle>
      <List>
        {series && series.map((seriesItem) => (
          <ListItem
            key={seriesItem?.id}
            button
            onClick={() => {
              let newIdsList = currentBookSeriesIds.filter(id => id !== seriesItem.id)
              if (newIdsList.length === currentBookSeriesIds.length) {
                newIdsList = [...currentBookSeriesIds, seriesItem.id || '-1']
              }
              id && editBook({ id: id, series: newIdsList })
            }}
          >
            <ListItemAvatar>
              {bookSeries?.find(item => item?.id === seriesItem?.id)
                ? <CheckCircleRounded />
                : <RadioButtonUncheckedOutlined />}
            </ListItemAvatar>
            <ListItemText primary={seriesItem?.name} />
          </ListItem>
        ))}
      </List>
      <DialogActions>
        <Button onClick={() => openManageBookSeriesDialog(undefined)} color="primary" autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}