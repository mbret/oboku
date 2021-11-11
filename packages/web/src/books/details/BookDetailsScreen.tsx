import { FC, useState, useEffect } from 'react';
import Button from '@material-ui/core/Button';
import { MoreVertRounded, EditRounded } from '@material-ui/icons';
import { TopBarNavigation } from '../../navigation/TopBarNavigation';
import { List, ListItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogActions, Chip, ListSubheader, Typography, Drawer, DialogContent, TextField, useTheme, Box, Divider, makeStyles } from '@material-ui/core';
import { useHistory, useParams } from 'react-router-dom';
import { useRefreshBookMetadata } from '../helpers';
import { Alert } from '@material-ui/lab';
import { Cover } from '../Cover';
import { useDownloadBook } from '../../download/useDownloadBook';
import { ROUTES } from '../../constants';
import { useManageBookCollectionsDialog } from '../ManageBookCollectionsDialog';
import { useRecoilValue } from 'recoil';
import { bookTagsState, bookLinksState, bookCollectionsState, enrichedBookState } from '../states';
import { normalizedLinksState } from '../../links/states';
import { useEditLink } from '../../links/helpers';
import { useCSS } from '../../common/utils';
import { useDataSourcePlugin } from '../../dataSources/helpers';
import { useDialogManager } from '../../dialog';
import { useManageBookTagsDialog } from '../ManageBookTagsDialog';
import { useIsDebugEnabled } from '../../debug';

type ScreenParams = {
  id: string
}

export const BookDetailsScreen = () => {
  const { styles, classes } = useStyles()
  const theme = useTheme()
  const history = useHistory()
  const downloadFile = useDownloadBook()
  const [isLinkActionDrawerOpenWith, setIsLinkActionDrawerOpenWith] = useState<undefined | string>(undefined)
  const { id } = useParams<ScreenParams>()
  const book = useRecoilValue(enrichedBookState(id))
  const tags = useRecoilValue(bookTagsState(id))
  const link = useRecoilValue(bookLinksState(id))[0]
  const collections = useRecoilValue(bookCollectionsState(id))
  const dialog = useDialogManager()
  const { openManageBookCollectionsDialog } = useManageBookCollectionsDialog()
  const { openManageBookTagsDialog } = useManageBookTagsDialog()
  const refreshBookMetadata = useRefreshBookMetadata()
  const dataSourcePlugin = useDataSourcePlugin(link?.type)
  const isDebugEnabled = useIsDebugEnabled()

  return (
    <div style={{
      flex: 1,
      overflow: 'auto'
    }}>
      <TopBarNavigation title="Book details" showBack={true} />
      <div style={styles.headerContent}>
        <div className={classes.coverContainer} >
          {book && (<Cover bookId={book._id} blurIfNeeded={false} />)}
        </div>
      </div>
      <div style={styles.titleContainer}>
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
          <Button fullWidth variant="outlined" color="primary" onClick={() => downloadFile(book)}>Download</Button>
        )}
        {book?.downloadState === 'downloading' && (
          <Button fullWidth variant="outlined" color="primary" disabled >Downloading...</Button>
        )}
        {book?.downloadState === 'downloaded' && (
          <Button fullWidth variant="outlined" color="primary" onClick={() => history.push(ROUTES.READER.replace(':id', book._id))}>Read</Button>
        )}
      </Box>
      {book?.metadataUpdateStatus === 'fetching' && (
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
        {isDebugEnabled && (
          <Box display="flex" flexDirection="row" alignItems="center">
            <Typography variant="body1" >id:&nbsp;</Typography>
            <Typography variant="body2" >{book?._id}</Typography>
          </Box>
        )}
      </Box>
      <Box paddingX={2} marginY={3} marginBottom={2}><Divider light /></Box>
      <List component="nav" aria-label="main mailbox folders">
        <ListItem
          button
          onClick={() => openManageBookTagsDialog(id)}
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
          onClick={() => book?._id && openManageBookCollectionsDialog(book?._id)}
        >
          <ListItemText
            primary="Collection"
            secondary={((collections?.length || 0) > 0)
              ? (
                <>
                  {collections?.map(item => (
                    <Chip label={item?.displayableName} key={item?._id} />
                  ))}
                </>
              )
              : 'Not a part of any collection yet'
            }
          />
          <MoreVertRounded />
        </ListItem>
      </List>
      <List subheader={<ListSubheader>Data source</ListSubheader>}>
        {!!link && !!dataSourcePlugin && (
          <ListItem
            key={link?._id}
            button
            onClick={() => dialog({ preset: 'NOT_IMPLEMENTED' })}
          >
            <ListItemIcon>
              <dataSourcePlugin.Icon />
            </ListItemIcon>
            <ListItemText
              primary={`${dataSourcePlugin?.name}`}
              primaryTypographyProps={{
                style: {
                  paddingRight: 10,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }
              }}
              secondary={`This book has been created from ${dataSourcePlugin.name}. Click to edit the data source`}
            />
            <MoreVertRounded />
          </ListItem>
        )}
        {process.env.NODE_ENV === 'development' && (
          <Button fullWidth variant="outlined" color="primary" onClick={() => { refreshBookMetadata(id) }}>debug:refresh_metadata</Button>
        )}
      </List>
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

const useClasses = makeStyles(theme => ({
  coverContainer: {
    width: '80%',
    [theme.breakpoints.down('sm')]: {
      width: '40%',
    },
    maxWidth: theme.custom.maxWidthCenteredContent,
  },
}))

const useStyles = () => {
  const theme = useTheme()
  const classes = useClasses()

  const styles = useCSS(() => ({
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
  }), [theme])

  return { styles, classes }
}