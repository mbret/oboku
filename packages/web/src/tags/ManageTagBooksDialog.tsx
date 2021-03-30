import { FC } from 'react'
import { BooksSelectionList } from '../books/BooksSelectionList'
import { Button, Dialog, DialogContent, useTheme } from '@material-ui/core'
import { useRemoveTagFromBook, useAddTagToBook } from '../books/helpers'
import { atom, useRecoilState, useRecoilValue } from 'recoil'
import { booksAsArrayState } from '../books/states'
import { tagState } from './states'
import { DialogTopBar } from '../navigation/DialogTopBar'
import { useCSS } from '../common/utils'

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
  const tagBooks = tag?.books?.map(item => item) || []
  const tagId = isManageTagBooksDialogOpenedWith
  const styles = useStyles()

  const isSelected = (selectedId: string) => !!tagBooks.find(id => id === selectedId)

  const onClose = () => {
    setIsManageTagBooksDialogOpenedWith(undefined)
  }

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
        <BooksSelectionList
          style={{ flex: 1 }}
          isSelected={isSelected}
          onItemClick={(bookId) => {
            if (isSelected(bookId)) {
              tagId && removeFromBook({ bookId, tagId })
            } else {
              tagId && addTagToBook({ _id: bookId, tagId })
            }
          }}
          books={books}
        />
        <Button style={styles.button} variant="outlined" color="primary" onClick={onClose}>Ok</Button>
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
      overflow: 'hidden'
    },
    button: {
      width: '100%',
    },
  }), [theme])
}