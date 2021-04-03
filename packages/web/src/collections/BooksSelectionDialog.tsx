import { FC } from 'react'
import { Button, Dialog, DialogContent, useTheme } from '@material-ui/core'
import { useRemoveCollectionFromBook, useAddCollectionToBook } from '../books/helpers'
import { useRecoilValue } from 'recoil'
import { booksAsArrayState } from '../books/states'
import { collectionState } from './states'
import { useMemo } from 'react'
import { useCallback } from 'react'
import { useCSS } from '../common/utils'
import { DialogTopBar } from '../navigation/DialogTopBar'
import { SelectableBookList } from '../books/bookList/SelectableBookList'

export const BooksSelectionDialog: FC<{
  onClose: () => void,
  open: boolean,
  collectionId: string,
}> = ({ onClose, open, collectionId }) => {
  const collection = useRecoilValue(collectionState(collectionId || '-1'))
  const books = useRecoilValue(booksAsArrayState)
  const [addToBook] = useAddCollectionToBook()
  const [removeFromBook] = useRemoveCollectionFromBook()
  const collectionBooks = useMemo(() => collection?.books?.map(item => item) || [], [collection])
  const styles = useStyles()

  const data = useMemo(() => books.map(item => ({
    id: item._id,
    selected: !!collectionBooks.find(id => id === item._id)
  })), [books, collectionBooks])

  const onItemClick = useCallback(({ id: bookId, selected }: { id: string, selected: boolean }) => {
    if (selected) {
      collectionId && removeFromBook({ _id: bookId, collectionId })
    } else {
      collectionId && addToBook({ _id: bookId, collectionId })
    }
  }, [collectionId, addToBook, removeFromBook])

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <DialogTopBar title="Manage books" onClose={onClose} />
      <DialogContent style={styles.container}>
        <div style={styles.listContainer}>
          <SelectableBookList
            style={styles.list}
            onItemClick={onItemClick}
            data={data}
          />
        </div>
        <div style={styles.buttonContainer}>
          <Button style={styles.button} variant="outlined" color="primary" onClick={onClose}>Ok</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const useStyles = () => {
  const theme = useTheme()

  return useCSS(() => ({
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flex: 1,
      overflow: 'hidden',
      padding: 0,
    },
    button: {
      width: '100%',
    },
    listContainer: {
      padding: `0px ${theme.spacing(1)}px`,
      flex: 1,
    },
    list: {
      flex: 1,
      height: '100%',
    },
    buttonContainer: {
      padding: `${theme.spacing(2)}px ${theme.spacing(2)}px`,
      borderTop: `1px solid ${theme.palette['grey']['500']}`
    }
  }), [theme])
}