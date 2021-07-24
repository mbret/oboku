import { useState, FC, useMemo, useCallback } from 'react'
import Dialog from '@material-ui/core/Dialog'
import {
  Button, DialogActions, DialogContent, DialogTitle, TextField,
  Toolbar, useTheme
} from '@material-ui/core'
import { ROUTES } from '../constants'
import { useHistory } from 'react-router-dom'
import { useCreateCollection } from '../collections/helpers'
import { useRecoilValue } from 'recoil'
import { collectionIdsState } from '../collections/states'
import { useCSS, useMeasureElement } from '../common/utils'
import { CollectionList } from '../collections/list/CollectionList'

export const LibraryCollectionScreen = () => {
  const classes = useStyles()
  const history = useHistory()
  const [isAddCollectionDialogOpened, setIsAddCollectionDialogOpened] = useState(false)
  const collections = useRecoilValue(collectionIdsState)

  const listHeader = useMemo(() => (
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
  ), [setIsAddCollectionDialogOpened])

  const listRenderHeader = useCallback(() => listHeader, [listHeader])

  const [listHeaderDimTracker, { height: listHeaderHeight }] = useMeasureElement(listHeader)

  return (
    <div style={classes.container}>
      {listHeaderDimTracker}
      <CollectionList
        style={{
          height: '100%'
        }}
        data={collections}
        headerHeight={listHeaderHeight}
        renderHeader={listRenderHeader}
        onItemClick={(item) => {
          history.push(ROUTES.COLLECTION_DETAILS.replace(':id', item._id))
        }}
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

const useStyles = () => {
  const theme = useTheme()

  return useCSS(() => ({
    container: {
      flex: 1,
      overflow: 'auto'
    },
    list: {
    },
  }), [theme])
}