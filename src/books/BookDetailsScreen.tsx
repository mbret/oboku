import React, { FC, useState, useEffect } from 'react';
import Button from '@material-ui/core/Button';
import { MoreVertRounded, EditRounded } from '@material-ui/icons';
import { TopBarNavigation } from '../TopBarNavigation';
import { List, ListItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogActions, Chip, makeStyles, ListSubheader, Typography, Drawer, DialogContent, TextField, useTheme, Box, Divider } from '@material-ui/core';
import { useHistory, useParams } from 'react-router-dom';
import { useAddTagToBook, useRemoveTagToBook } from '../books/helpers';
import { TagsSelectionList } from '../tags/TagsSelectionList';
import { Alert } from '@material-ui/lab';
import { Cover } from './Cover';
import { useDownloadBook } from '../download/useDownloadBook';
import { ROUTES } from '../constants';
import { openManageBookCollectionsDialog } from './ManageBookCollectionsDialog';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { bookState, bookTagsState, bookLinksState, bookCollectionsState, enrichedBookState } from './states';
import { tagsAsArrayState } from '../tags/states';
import { normalizedLinksState } from '../links/states';
import { useEditLink } from '../links/helpers';

type ScreenParams = {
  id: string
}

export const BookDetailsScreen = () => {
  const classes = useClasses()
  const theme = useTheme()
  const history = useHistory()
  const downloadFile = useDownloadBook()
  const [isTagsDialogOpened, setIsTagsDialogOpened] = useState(false)
  const [isLinkActionDrawerOpenWith, setIsLinkActionDrawerOpenWith] = useState<undefined | string>(undefined)
  const { id } = useParams<ScreenParams>()
  const book = useRecoilValue(enrichedBookState(id))
  const tags = useRecoilValue(bookTagsState(id))
  const links = useRecoilValue(bookLinksState(id))
  const collections = useRecoilValue(bookCollectionsState(id))
  const setOpenManageBookCollectionsDialog = useSetRecoilState(openManageBookCollectionsDialog)

  console.log('[BookDetailsScreen]', { book, tags, links })

  return (
    <div style={{
      flex: 1,
      overflow: 'auto'
    }}>
      <TopBarNavigation title="Book details" showBack={true} />
      <div className={classes.headerContent}>
        <div className={classes.coverContainer} >
          {book && (<Cover bookId={book._id} />)}
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
          <Button fullWidth variant="outlined" color="primary" onClick={() => downloadFile(book._id)}>Download</Button>
        )}
        {book?.downloadState === 'downloading' && (
          <Button fullWidth variant="outlined" color="primary" disabled >Downloading...</Button>
        )}
        {book?.downloadState === 'downloaded' && (
          <Button fullWidth variant="outlined" color="primary" onClick={() => history.push(ROUTES.READER.replace(':id', book._id))}>Read</Button>
        )}
      </Box>
      {!book?.lastMetadataUpdatedAt && (
        <Alert severity="info" >We are still retrieving metadata information...</Alert>
      )}
      <Box paddingX={2} marginY={3} marginBottom={3}><Divider light /></Box>
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
          <Typography variant="body2" >{book?.lang}</Typography>
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
            secondary={((tags?.length || 0) > 0)
              ? (
                <>
                  {tags?.map(tag => (
                    <Chip label={tag?.name} key={tag?._id} />
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
          onClick={() => setOpenManageBookCollectionsDialog(book?._id)}
        >
          <ListItemText
            primary="Collection"
            secondary={((collections?.length || 0) > 0)
              ? (
                <>
                  {collections?.map(item => (
                    <Chip label={item?.name} key={item?._id} />
                  ))}
                </>
              )
              : 'Not a part of any collection yet'
            }
          />
          <MoreVertRounded />
        </ListItem>
      </List>
      <List subheader={<ListSubheader>Links</ListSubheader>}>
        {links?.map(item => (
          <ListItem
            key={item?._id}
            button
            onClick={() => setIsLinkActionDrawerOpenWith(item?._id)}
          >
            <ListItemText
              primary={item?.resourceId}
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
      <LinkActionsDrawer
        openWith={isLinkActionDrawerOpenWith}
        bookId={book?._id}
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
        onClose={() => setIsEditDialogOpenWith(undefined)}
      />
    </>
  )
}

const EditLinkDialog: FC<{
  openWith: string | undefined,
  onClose: () => void,
}> = ({ onClose, openWith }) => {
  const [location, setLocation] = useState('')
  const link = useRecoilValue(normalizedLinksState)[openWith || '-1']
  const editLink = useEditLink()

  const onInnerClose = () => {
    setLocation('')
    onClose()
  }

  useEffect(() => {
    setLocation(prev => link?.resourceId || prev)
  }, [link, openWith])

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
            link && editLink({
              _id: link._id,
              resourceId: location,
            })
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
  const tags = useRecoilValue(tagsAsArrayState)
  const book = useRecoilValue(bookState(id))
  const [addTagToBook] = useAddTagToBook()
  const removeTagToBook = useRemoveTagToBook()
  const bookTags = book?.tags
  const isSelected = (tagId: string) => !!bookTags?.find(itemId => itemId === tagId)

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
          isSelected={isSelected}
          onItemClick={tagId => {
            if (!isSelected(tagId)) addTagToBook({ tagId, _id: id })
            else removeTagToBook({ tagId, bookId: id })
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

const useClasses = makeStyles(theme => {
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