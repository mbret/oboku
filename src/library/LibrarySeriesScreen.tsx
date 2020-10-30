import React, { useState, FC, useEffect } from 'react';
import '../App.css';
import Dialog from '@material-ui/core/Dialog';
import { Button, DialogActions, DialogContent, DialogTitle, TextField, Toolbar, IconButton, makeStyles, createStyles, ListItem, ListItemText, List, ListItemIcon, Drawer, Divider, withStyles } from '@material-ui/core';
import { DeleteForeverRounded, MoreVert, Edit } from '@material-ui/icons';
import { useMutationEditSeries, useQueryGetSeries, useMationAddSeries, useMutationRemoveSeries, useLazyQueryGetOneSeries } from '../queries';
import { API_URI, ROUTES } from '../constants';
import { useHistory } from 'react-router-dom';

export const LibrarySeriesScreen = () => {
  const classes = useStyles();
  const history = useHistory()
  const [isAddSeriesDialogOpened, setIsAddSeriesDialogOpened] = useState(false)
  const [isActionDialogOpenedWith, setIsActionDialogOpenedWith] = useState<string | undefined>(undefined)
  const { data: seriesData } = useQueryGetSeries()

  const series = seriesData?.series

  console.log('[LibrarySeriesScreen]', seriesData)

  return (
    <div className={classes.container}>
      <Toolbar>
        <Button
          style={{
            width: '100%'
          }}
          variant="outlined"
          disableFocusRipple
          disableRipple
          onClick={() => setIsAddSeriesDialogOpened(true)}
        >
          Create a new series
        </Button>
      </Toolbar>
      <List className={classes.list}>
        {series && series.map(item => (
          <ListItem
            button
            key={item.id}
            className={classes.listItem}
            onClick={() => {
              item?.id && history.push(ROUTES.SERIES_DETAILS.replace(':id', item.id))
            }}
          >
            <div className={classes.itemCard}>
              <div className={classes.itemBottomRadius} />
              <div style={{
                width: '100%',
                height: '70%',
                zIndex: 1,
                display: 'flex',
                justifyContent: 'center',
              }}>
                {item.books?.slice(0, 3).map(bookItem => (
                  <img
                    alt="img"
                    src={`${API_URI}/cover/${bookItem?.id}`}
                    style={{
                      border: '1px solid black',
                      height: '100%',
                      marginRight: 10,
                      marginLeft: 10,
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{
              display: 'flex',
              flexFlow: 'row',
              width: '100%',
              alignItems: 'center'
            }}>
              <ListItemText primary={item.name} secondary={`${item.books?.length || 0} book(s)`} />
              <IconButton
                onClick={(e) => {
                  e.stopPropagation()
                  setIsActionDialogOpenedWith(item.id)
                }}
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
      <ActionDialog open={!!isActionDialogOpenedWith} id={isActionDialogOpenedWith} onClose={() => setIsActionDialogOpenedWith(undefined)} />
      <AddSeriesDialog
        onClose={() => setIsAddSeriesDialogOpened(false)}
        open={isAddSeriesDialogOpened}
      />
    </div>
  );
}

const AddSeriesDialog: FC<{
  open: boolean,
  onClose: () => void,
}> = ({ onClose, open }) => {
  const [name, setName] = useState('')
  const [addSeries] = useMationAddSeries()

  const onInnerClose = () => {
    setName('')
    onClose()
  }

  const onConfirm = (name: string) => {
    if (name) {
      addSeries({ variables: { name } }).catch(() => { })
    }
  }

  return (
    <Dialog onClose={onInnerClose} open={open}>
      <DialogTitle>Add a series</DialogTitle>
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
            onConfirm(name)
          }}
          color="primary"
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const EditSeriesDialog: FC<{
  open: boolean,
  id: string | undefined,
  onClose: () => void,
}> = ({ onClose, open, id }) => {
  const [name, setName] = useState('')
  const [getTag, { data }] = useLazyQueryGetOneSeries()
  const [editSeries] = useMutationEditSeries()
  const { name: seriesName } = data?.oneSeries || {}

  const onInnerClose = () => {
    setName('')
    onClose()
  }

  const onConfirm = (id: string, name: string) => {
    if (name) {
      editSeries({ variables: { id, name } })
    }
  }

  useEffect(() => {
    id && getTag({ variables: { id } })
  }, [id, getTag])

  useEffect(() => {
    setName(prev => seriesName || prev)
  }, [seriesName, id])

  console.log('EditSeriesDialog', id, seriesName, data)

  return (
    <Dialog onClose={onInnerClose} open={open}>
      <DialogTitle>Series: {seriesName}</DialogTitle>
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
            id && onConfirm(id, name)
          }}
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const ActionDialog: FC<{
  open: boolean,
  id: string | undefined,
  onClose: () => void,
}> = ({ open, id, onClose }) => {
  const [isEditSeriesDialogOpenedWithId, setIsEditSeriesDialogOpenedWithId] = useState<string | undefined>(undefined)
  const [getOneSeries, { data }] = useLazyQueryGetOneSeries()
  const [removeSeries] = useMutationRemoveSeries()

  const handleClose = () => {
    onClose()
  };

  const onRemove = (id: string | undefined) => {
    handleClose()
    id && removeSeries({ variables: { id } }).catch(() => { })
  }

  const onEdit = (id: string | undefined) => {
    handleClose()
    id && setIsEditSeriesDialogOpenedWithId(id)
  }

  useEffect(() => {
    id && getOneSeries({
      variables: { id }
    })
  }, [id, getOneSeries])

  console.log('[ActionDialog]', data)

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={handleClose}
      >
        <div
          role="presentation"
        >
          <List>
            <ListItem button onClick={() => onEdit(id)}>
              <ListItemIcon><Edit /></ListItemIcon>
              <ListItemText primary="Edit" />
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem button onClick={() => onRemove(id)}>
              <ListItemIcon><DeleteForeverRounded /></ListItemIcon>
              <ListItemText primary="Remove" />
            </ListItem>
          </List>
        </div>
      </Drawer>
      <EditSeriesDialog
        id={isEditSeriesDialogOpenedWithId}
        onClose={() => setIsEditSeriesDialogOpenedWithId(undefined)}
        open={!!isEditSeriesDialogOpenedWithId}
      />
    </>
  );
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
      height: 200,
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
);