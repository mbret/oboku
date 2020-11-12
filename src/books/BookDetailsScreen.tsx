import React, { FC, useState, useEffect } from 'react';
import Button from '@material-ui/core/Button';
import { CheckCircleRounded, RadioButtonUncheckedOutlined, MoreVertRounded, EditRounded } from '@material-ui/icons';
import { TopBarNavigation } from '../TopBarNavigation';
import { List, ListItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogActions, ListItemAvatar, Chip, makeStyles, ListSubheader, Typography, Drawer, DialogContent, TextField, useTheme, Box, Divider } from '@material-ui/core';
import { useHistory, useParams } from 'react-router-dom';
import { useQueryGetSeries } from '../series/queries';
import { useBook, useEditBook, useLazyBook } from '../books/queries';
import { useQueryGetTags } from '../tags/queries';
import { useEditLink } from '../links/queries';
import { TagsSelectionList } from '../tags/TagsSelectionList';
import { Alert } from '@material-ui/lab';
import { Cover } from './Cover';
import { useDownloadFile } from '../download/useDownloadFile';
import { ROUTES } from '../constants';

type ScreenParams = {
  id: string
}

export const BookDetailsScreen = () => {
  const classes = useClasses()
  const theme = useTheme()
  const history = useHistory()
  const downloadFile = useDownloadFile()
  const [isTagsDialogOpened, setIsTagsDialogOpened] = useState(false)
  const [isSeriesDialogOpened, setIsSeriesDialogOpened] = useState(false)
  const [isLinkActionDrawerOpenWith, setIsLinkActionDrawerOpenWith] = useState<undefined | string>(undefined)
  const { id } = useParams<ScreenParams>()
  const { data } = useBook({ variables: { id } })
  const book = data?.book
  const series = book?.series

  console.log('[BookDetailsScreen]', book)

  return (
    <div style={{
      flex: 1
    }}>
      <TopBarNavigation title="Book details" showBack={true} />
      <div className={classes.headerContent}>
        <div className={classes.coverContainer} >
          {book && (<Cover bookId={book.id} />)}
        </div>
      </div>
      <div className={classes.titleContainer}>
        <Typography variant="body1">
          {book?.title || 'Unknown'}
        </Typography>
        <Typography gutterBottom variant="caption">
          By {book?.creator || 'Unknown'}
        </Typography>
      </div>
      <Box marginBottom={1} style={{
        display: 'flex',
        width: '100%',
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
      }}>
        {book?.downloadState === 'none' && (
          <Button fullWidth variant="outlined" color="primary" onClick={() => downloadFile(book.id)}>Download</Button>
        )}
        {book?.downloadState === 'downloading' && (
          <Button fullWidth variant="outlined" color="primary" disabled >Downloading...</Button>
        )}
        {book?.downloadState === 'downloaded' && (
          <Button fullWidth variant="outlined" color="primary" onClick={() => history.push(ROUTES.READER.replace(':id', book.id))}>Read</Button>
        )}
      </Box>
      {!book?.lastMetadataUpdatedAt && (
        <Alert severity="info" >We are still retrieving metadata information...</Alert>
      )}
      <Box paddingX={2} marginY={3} marginBottom={3}><Divider light  /></Box>
      <Box paddingX={2}>
        <Typography variant="subtitle1"><b>More details</b></Typography>
        <Box display="flex" flexDirection="row" alignItems="center">
          <Typography variant="body1" >Date:&nbsp;</Typography>
          <Typography variant="body2" >{book?.date && (new Date(book.date)).toLocaleDateString()}</Typography>
        </Box>
        <Box display="flex" flexDirection="row" alignItems="center">
          <Typography variant="body1" >Publisher:&nbsp;</Typography>
          <Typography variant="body2" >{book?.publisher}</Typography>
        </Box>
        <Box display="flex" flexDirection="row" alignItems="center">
          <Typography variant="body1" >Genre:&nbsp;</Typography>
          <Typography variant="body2" >{book?.subject}</Typography>
        </Box>
        <Box display="flex" flexDirection="row" alignItems="center">
          <Typography variant="body1" >Language:&nbsp;</Typography>
          <Typography variant="body2" >{book?.language}</Typography>
        </Box>
      </Box>
      <Box paddingX={2} marginY={3} marginBottom={2}><Divider light /></Box>
      <List component="nav" aria-label="main mailbox folders">
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
                    <Chip label={tag?.name} key={tag?.id} />
                  ))}
                </>
              )
              : 'No tags yet'
            }
          />
          <MoreVertRounded />
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
                    <Chip label={item?.name} key={item?.id} />
                  ))}
                </>
              )
              : 'Not a part of any series yet'
            }
          />
          <MoreVertRounded />
        </ListItem>
      </List>
      <List subheader={<ListSubheader>Links</ListSubheader>}>
        {book?.links?.map(item => (
          <ListItem
            key={item?.id}
            button
            onClick={() => setIsLinkActionDrawerOpenWith(item?.id)}
          >
            <ListItemText
              primary={item?.location}
              primaryTypographyProps={{
                style: {
                  paddingRight: 10,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }
              }}
              secondary="This is your metadata link"
            />
            <MoreVertRounded />
          </ListItem>
        ))}
      </List>
      <TagsDialog id={id} open={isTagsDialogOpened} onClose={() => setIsTagsDialogOpened(false)} />
      <SeriesDialog id={id} open={isSeriesDialogOpened} onClose={() => setIsSeriesDialogOpened(false)} />
      <LinkActionsDrawer
        openWith={isLinkActionDrawerOpenWith}
        bookId={book?.id}
        onClose={() => setIsLinkActionDrawerOpenWith(undefined)}
      />
    </div>
  );
}

const LinkActionsDrawer: FC<{
  openWith: string | undefined,
  bookId: string | undefined,
  onClose: () => void
}> = ({ openWith, onClose, bookId }) => {
  const [isEditDialogOpenWith, setIsEditDialogOpenWith] = useState<string | undefined>(undefined)

  return (
    <>
      <Drawer
        anchor="bottom"
        open={!!openWith}
        onClose={onClose}
      >
        <List>
          <ListItem button
            onClick={() => {
              setIsEditDialogOpenWith(openWith)
            }}
          >
            <ListItemIcon>
              <EditRounded />
            </ListItemIcon>
            <ListItemText primary="Edit the location" />
          </ListItem>
        </List>
      </Drawer>
      <EditLinkDialog
        openWith={isEditDialogOpenWith}
        bookId={bookId}
        onClose={() => setIsEditDialogOpenWith(undefined)}
      />
    </>
  )
}

const EditLinkDialog: FC<{
  openWith: string | undefined,
  bookId: string | undefined,
  onClose: () => void,
}> = ({ onClose, openWith, bookId }) => {
  const [location, setLocation] = useState('')
  const [getBook, { data }] = useLazyBook()
  const editLink = useEditLink()
  const link = data?.book.links?.find(item => item?.id === openWith)

  const onInnerClose = () => {
    setLocation('')
    onClose()
  }

  useEffect(() => {
    bookId && getBook({ variables: { id: bookId } })
  }, [bookId, getBook])

  useEffect(() => {
    setLocation(prev => link?.location || prev)
  }, [link, openWith])

  console.log('EditLinkDialog', data)

  return (
    <Dialog onClose={onInnerClose} open={!!openWith}>
      <DialogTitle>Link edit</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          id="name"
          label="Name"
          type="text"
          fullWidth
          value={location}
          onChange={e => setLocation(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onInnerClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={() => {
            onInnerClose()
            openWith && bookId && editLink(bookId, openWith, location)
          }}
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const TagsDialog: FC<{
  open: boolean,
  onClose: () => void,
  id: string
}> = ({ open, onClose, id }) => {
  const { data: getTagsData } = useQueryGetTags()
  const { data: getBookData } = useBook({ variables: { id } })
  const editBook = useEditBook()
  const tags = getTagsData?.tags
  const bookTags = getBookData?.book?.tags
  const currentBookTagIds = bookTags?.map(tag => tag?.id || '-1') || []

  return (
    <Dialog
      onClose={onClose}
      aria-labelledby="simple-dialog-title"
      open={open}
    >
      <DialogTitle>Tags selection</DialogTitle>
      {tags && (
        <TagsSelectionList
          tags={tags}
          isSelected={tagId => !!bookTags?.find(item => item?.id === tagId)}
          onItemClick={tagId => {
            let newTagList = currentBookTagIds.filter(currentId => currentId !== tagId)
            if (newTagList.length === currentBookTagIds.length) {
              newTagList = [...currentBookTagIds, tagId || '-1']
            }
            editBook({ id, tags: newTagList })
          }}
        />
      )}
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
  const { data: getBookData } = useBook({ variables: { id } })
  const editBook = useEditBook()
  const series = getSeriesData?.series
  const bookSeries = getBookData?.book?.series
  const currentBookSeriesIds = bookSeries?.map(item => item?.id || '-1') || []

  console.log('[SeriesDialog]', getSeriesData, getBookData)

  return (
    <Dialog
      onClose={onClose}
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
              editBook({ id: id, series: newIdsList })
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

const useClasses = makeStyles(theme => {
  type Props = {}

  return {
    coverContainer: {
      width: '80%',
      [theme.breakpoints.down('sm')]: {
        width: '40%',
      },
      maxWidth: theme.custom.maxWidthCenteredContent,
    },
    headerContent: {
      paddingBottom: theme.spacing(2),
      paddingTop: theme.spacing(3),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleContainer: {
      maxWidth: theme.custom.maxWidthCenteredContent,
      margin: 'auto',
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      marginBottom: theme.spacing(1),
      display: 'flex',
      alignItems: 'center',
      flexFlow: 'column',
      justifyContent: 'center',
      textAlign: 'center',
    },
    cover: {
      height: '20vh'
    }
  }
})