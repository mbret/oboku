import { FC, useMemo } from 'react'
import { Button, Dialog, DialogContent, useTheme } from '@material-ui/core'
import { useRemoveTagFromBook, useAddTagToBook } from '../books/helpers'
import { atom, useRecoilState, useRecoilValue } from 'recoil'
import { booksAsArrayState } from '../books/states'
import { tagState } from './states'
import { DialogTopBar } from '../navigation/DialogTopBar'
import { useCSS } from '../common/utils'
import { useCallback } from 'react'
import { SelectableBookList } from '../books/bookList/SelectableBookList'

export const isManageTagBooksDialogOpenedWithState = atom<string | undefined>({
  key: 'isManageTagBooksDialogOpenedWith',
  default: undefined
})

export const ManageTagBooksDialog: FC<{}> = () => {
  const [isManageTagBooksDialogOpenedWith, setIsManageTagBooksDialogOpenedWith] = useRecoilState(isManageTagBooksDialogOpenedWithState)
  const tag = useRecoilValue(tagState(isManageTagBooksDialogOpenedWith || '-1'))
  const books = useRecoilValue(booksAsArrayState)
  const addTagToBook = useAddTagToBook()
  const removeFromBook = useRemoveTagFromBook()
  const tagBooks = useMemo(() => tag?.books?.map(item => item) || [], [tag])
  const tagId = isManageTagBooksDialogOpenedWith
  const styles = useStyles()

  const onClose = () => {
    setIsManageTagBooksDialogOpenedWith(undefined)
  }

  const data = useMemo(() => books.map(item => ({
    id: item._id,
    selected: !!tagBooks.find(id => id === item._id)
  })), [books, tagBooks])

  const onItemClick = useCallback(({ id: bookId, selected }: { id: string, selected: boolean }) => {
    if (selected) {
      tagId && removeFromBook({ bookId, tagId })
    } else {
      tagId && addTagToBook({ _id: bookId, tagId })
    }
  }, [removeFromBook, addTagToBook, tagId])
  
  return (
    <Dialog
      open={!!tagId}
      onClose={() => {
        setIsManageTagBooksDialogOpenedWith(undefined)
      }}
      fullScreen
    >
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