import { FC } from 'react'
import { Button, Dialog, DialogContent, useTheme } from '@material-ui/core'
import { DialogTopBar } from '../navigation/DialogTopBar'
import { useCSS } from '../common/utils'
import { SelectableBookList } from '../books/bookList/SelectableBookList'

export const BooksSelectionDialog: FC<{
  onItemClick: (id: { id: string, selected: boolean }) => void,
  data: { id: string, selected: boolean }[],
  onClose: () => void,
  open: boolean
}> = ({ onItemClick, data, onClose, open }) => {
  const styles = useStyles()

  return (
    <Dialog
      open={open}
      onClose={onClose}
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