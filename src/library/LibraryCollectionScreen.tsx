import React, { useState, FC } from 'react'
import Dialog from '@material-ui/core/Dialog'
import {
  Button, DialogActions, DialogContent, DialogTitle, TextField,
  Toolbar, IconButton, makeStyles, createStyles, ListItem, ListItemText, List, useTheme
} from '@material-ui/core'
import { MoreVert } from '@material-ui/icons'
import { ROUTES } from '../constants'
import { useHistory } from 'react-router-dom'
import { CollectionActionsDrawer } from '../collections/CollectionActionsDrawer'
import { Cover } from '../books/Cover'
import { useCreateCollection } from '../collections/helpers'
import { useRecoilValue } from 'recoil'
import { collectionsAsArrayState } from '../collections/states'

export const LibraryCollectionScreen = () => {
  const classes = useStyles()
  const history = useHistory()
  const [isAddCollectionDialogOpened, setIsAddCollectionDialogOpened] = useState(false)
  const [isActionDialogOpenedWith, setIsActionDialogOpenedWith] = useState<string | undefined>(undefined)
  const collections = useRecoilValue(collectionsAsArrayState)
  const theme = useTheme()
  const cardHeight = 200

  return (
    <div className={classes.container}>
      <Toolbar>
        <Button
          style={{
            width: '100%'
          }}
          variant="outlined"
          color="primary"
          onClick={() => setIsAddCollectionDialogOpened(true)}
        >
          Create a new collection
        </Button>
      </Toolbar>
      <List className={classes.list}>
        {collections && collections.map(item => (
          <ListItem
            button
            key={item?._id}
            className={classes.listItem}
            onClick={() => {
              item?._id && history.push(ROUTES.COLLECTION_DETAILS.replace(':id', item._id))
            }}
          >
            <div className={classes.itemCard} style={{ height: cardHeight }}>
              <div className={classes.itemBottomRadius} />
              <div style={{
                width: '100%',
                zIndex: 1,
                display: 'flex',
                justifyContent: 'center',
              }}>
                {item?.books?.slice(0, 3).map((bookItem, i) => {
                  const length = (item?.books?.length || 0)
                  const coverHeight = 200 * (length < 3 ? 0.6 : 0.5)

                  if (!bookItem) return null

                  return (
                    <Cover
                      key={bookItem}
                      bookId={bookItem}
                      withShadow
                      style={{
                        height: coverHeight,
                        width: coverHeight * theme.custom.coverAverageRatio,
                        ...(length > 2 && i === 1) && {
                          marginTop: -10,
                        },
                        marginRight: 5,
                        marginLeft: 5,
                      }}
                    />
                  )
                })}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexFlow: 'row',
                width: '100%',
                alignItems: 'center'
              }}
              onClick={(e) => {
                e.stopPropagation()
                setIsActionDialogOpenedWith(item?._id)
              }}
            >
              <ListItemText primary={item?.name} secondary={`${item?.books?.length || 0} book(s)`} />
              <IconButton
                disableFocusRipple
                disableRipple
                disableTouchRipple
                edge="end"
              >
                <MoreVert />
              </IconButton>
            </div>
          </ListItem>
        ))}
      </List>
      <CollectionActionsDrawer
        open={!!isActionDialogOpenedWith}
        id={isActionDialogOpenedWith}
        onClose={() => setIsActionDialogOpenedWith(undefined)}
      />
      <AddCollectionDialog
        onClose={() => setIsAddCollectionDialogOpened(false)}
        open={isAddCollectionDialogOpened}
      />
    </div>
  )
}

const AddCollectionDialog: FC<{
  open: boolean,
  onClose: () => void,
}> = ({ onClose, open }) => {
  const [name, setName] = useState('')
  const [addCollection] = useCreateCollection()

  const onInnerClose = () => {
    setName('')
    onClose()
  }

  return (
    <Dialog onClose={onInnerClose} open={open}>
      <DialogTitle>Create a new collection</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          id="name"
          label="Name"
          type="text"
          fullWidth
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onInnerClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={() => {
            onInnerClose()
            if (name) {
              addCollection({ name })
            }
          }}
          color="primary"
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const useStyles = makeStyles((theme) =>
  createStyles({
    container: {
      flex: 1,
      overflow: 'auto'
    },
    list: {
    },
    listItem: {
      paddingRight: theme.spacing(2),
      paddingLeft: theme.spacing(2),
      flexFlow: 'column',
      position: 'relative',
    },
    itemCard: {
      backgroundColor: theme.palette.grey[200],
      width: '100%',
      display: 'flex',
      borderRadius: 10,
      overflow: 'hidden',
      position: 'relative',
      alignItems: 'center',
    },
    itemBottomRadius: {
      backgroundColor: theme.palette.grey[300],
      height: '50%',
      width: '100%',
      borderTopLeftRadius: '50%',
      borderTopRightRadius: '50%',
      alignSelf: 'flex-end',
      position: 'absolute',
    },
  }),
)