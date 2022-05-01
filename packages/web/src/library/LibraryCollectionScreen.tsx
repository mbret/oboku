import { useState, FC, useMemo, useCallback, ComponentProps } from 'react'
import Dialog from '@material-ui/core/Dialog'
import {
  Button, DialogActions, DialogContent, DialogTitle, TextField,
  Toolbar, useTheme
} from '@material-ui/core'
import { ROUTES } from '../constants'
import { useHistory } from 'react-router-dom'
import { useCreateCollection } from '../collections/helpers'
import { atom, useRecoilState, useRecoilValue } from 'recoil'
import { collectionIdsState } from '../collections/states'
import { useCSS, useMeasureElement } from '../common/utils'
import { CollectionList } from '../collections/list/CollectionList'
import { useDebouncedCallback } from 'use-debounce'

type Scroll = Parameters<NonNullable<ComponentProps<typeof CollectionList>['onScroll']>>[0]

const libraryCollectionScreenPreviousScrollState = atom<Scroll>({
  key: `libraryCollectionScreenPreviousScrollState`,
  default: { horizontalScrollDirection: `backward`, scrollLeft: 0, scrollTop: 0, scrollUpdateWasRequested: false, verticalScrollDirection: `forward` }
})

export const LibraryCollectionScreen = () => {
  const classes = useStyles()
  const history = useHistory()
  const [isAddCollectionDialogOpened, setIsAddCollectionDialogOpened] = useState(false)
  const [libraryCollectionScreenPreviousScroll, setLibraryCollectionScreenPreviousScroll] = useRecoilState(libraryCollectionScreenPreviousScrollState)
  const collections = useRecoilValue(collectionIdsState)

  const onScroll = useDebouncedCallback((value: Scroll) => {
    setLibraryCollectionScreenPreviousScroll(value)
  }, 300)

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

  const onItemClick = useCallback((item) => {
    history.push(ROUTES.COLLECTION_DETAILS.replace(':id', item._id))
  }, [history])

  return (
    <div style={classes.container}>
      {listHeaderDimTracker}
      <CollectionList
        style={classes.list}
        data={collections}
        headerHeight={listHeaderHeight}
        renderHeader={listRenderHeader}
        onItemClick={onItemClick}
        onScroll={onScroll}
        initialScrollLeft={libraryCollectionScreenPreviousScroll.scrollLeft}
        initialScrollTop={libraryCollectionScreenPreviousScroll.scrollTop}
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
      height: '100%'
    },
  }), [theme])
}