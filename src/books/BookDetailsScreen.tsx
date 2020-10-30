import React, { FC, useState } from 'react';
import Button from '@material-ui/core/Button';
import { ArrowForwardIosRounded, CheckCircleRounded, RadioButtonUncheckedOutlined } from '@material-ui/icons';
import { TopBarNavigation } from '../TopBarNavigation';
import { List, ListItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogActions, ListItemAvatar, Chip, makeStyles } from '@material-ui/core';
import { useParams } from 'react-router-dom';
import { useQueryGetTags, useQueryGetSeries } from '../queries';
import { API_URI } from '../constants';
import { useQueryGetBook, useMutationEditBook } from '../books/queries';

type ScreenParams = {
  id: string
}

export const BookDetailsScreen = () => {
  const classes = useClasses()
  const [isTagsDialogOpened, setIsTagsDialogOpened] = useState(false)
  const [isSeriesDialogOpened, setIsSeriesDialogOpened] = useState(false)
  const { id } = useParams<ScreenParams>()
  const { data } = useQueryGetBook({ variables: { id } })
  const book = data?.book
  const series = book?.series

  console.log('[BookDetailsScreen]', book)
  return (
    <div style={{
      flex: 1
    }}>
      <TopBarNavigation title={book?.title || ''} showBack={true} />
      <List component="nav" aria-label="main mailbox folders">
        <div className={classes.coverContainer} >
          <img
            alt="img"
            src={`${API_URI}/cover/${book?.id}`}
            className={classes.cover}
          />
        </div>
        <ListItem
          button
          onClick={() => setIsTagsDialogOpened(true)}
        >
          <ListItemText
            primary="Tags"
            secondary={((book?.tags?.length || 0) > 0)
              ? (
                <>
                  {book?.tags?.map(tag => (
                    <Chip label={tag.name} key={tag.id} />
                  ))}
                </>
              )
              : 'No tags yet'
            }
          />
          <ListItemIcon>
            <ArrowForwardIosRounded />
          </ListItemIcon>
        </ListItem>
        <ListItem
          button
          onClick={() => setIsSeriesDialogOpened(true)}
        >
          <ListItemText
            primary="Series"
            secondary={((series?.length || 0) > 0)
              ? (
                <>
                  {series?.map(item => (
                    <Chip label={item.name} key={item.id} />
                  ))}
                </>
              )
              : 'Not a part of any series yet'
            }
          />
          <ListItemIcon>
            <ArrowForwardIosRounded />
          </ListItemIcon>
        </ListItem>
      </List>
      <TagsDialog id={id} open={isTagsDialogOpened} onClose={() => setIsTagsDialogOpened(false)} />
      <SeriesDialog id={id} open={isSeriesDialogOpened} onClose={() => setIsSeriesDialogOpened(false)} />
    </div>
  );
}

const TagsDialog: FC<{
  open: boolean,
  onClose: () => void,
  id: string
}> = ({ open, onClose, id }) => {
  const { data: getTagsData } = useQueryGetTags()
  const { data: getBookData } = useQueryGetBook({ variables: { id } })
  const [editBook] = useMutationEditBook()
  const tags = getTagsData?.tags
  const bookTags = getBookData?.book?.tags
  const currentBookTagIds = bookTags?.map(tag => tag.id || '-1') || []

  return (
    <Dialog
      onClose={onClose}
      aria-labelledby="simple-dialog-title"
      open={open}
    >
      <DialogTitle>Tags selection</DialogTitle>
      <List>
        {tags && tags.map((tag) => (
          <ListItem
            key={tag?.id}
            button
            onClick={() => {
              let newTagList = currentBookTagIds.filter(id => id !== tag.id)
              if (newTagList.length === currentBookTagIds.length) {
                newTagList = [...currentBookTagIds, tag.id || '-1']
              }
              editBook({ variables: { id: id, tags: newTagList } }).catch(() => { })
            }}
          >
            <ListItemAvatar>
              {bookTags?.find(item => item?.id === tag?.id)
                ? <CheckCircleRounded />
                : <RadioButtonUncheckedOutlined />}
            </ListItemAvatar>
            <ListItemText primary={tag?.name} />
          </ListItem>
        ))}
      </List>
      <DialogActions>
        <Button onClick={onClose} color="primary" autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const SeriesDialog: FC<{
  open: boolean,
  onClose: () => void,
  id: string
}> = ({ open, onClose, id }) => {
  const { data: getSeriesData } = useQueryGetSeries()
  const { data: getBookData } = useQueryGetBook({ variables: { id } })
  const [editBook] = useMutationEditBook()
  const series = getSeriesData?.series
  const bookSeries = getBookData?.book?.series
  const currentBookSeriesIds = bookSeries?.map(item => item.id || '-1') || []

  console.log('[SeriesDialog]', getSeriesData, getBookData)

  return (
    <Dialog
      onClose={onClose}
      aria-labelledby="simple-dialog-title"
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
              editBook({ variables: { id: id, series: newIdsList } }).catch(() => { })
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
        <Button onClick={onClose} color="primary" autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const useClasses = makeStyles({
  coverContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  },
  cover: {
    height: '20vh'
  }
})