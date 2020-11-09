import React, { useState, FC } from 'react';
import '../App.css';
import Dialog from '@material-ui/core/Dialog';
import {
  Button, DialogActions, DialogContent, DialogTitle, TextField,
  Toolbar, IconButton, makeStyles, createStyles, ListItem, ListItemText, List
} from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';
import { useQueryGetSeries, useAddSeries } from '../series/queries';
import { API_URI, ROUTES } from '../constants';
import { useHistory } from 'react-router-dom';
import { SeriesActionsDrawer } from '../series/SeriesActionsDrawer';

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
      <SeriesActionsDrawer
        open={!!isActionDialogOpenedWith}
        id={isActionDialogOpenedWith}
        onClose={() => setIsActionDialogOpenedWith(undefined)}
      />
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
  const addSeries = useAddSeries()

  const onInnerClose = () => {
    setName('')
    onClose()
  }

  const onConfirm = (name: string) => {
    if (name) {
      addSeries(name)
    }
  }

  return (
    <Dialog onClose={onInnerClose} open={open}>
      <DialogTitle>Create a new series</DialogTitle>
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