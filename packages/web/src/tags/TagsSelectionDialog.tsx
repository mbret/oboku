import { FC } from 'react'
import { Button, Dialog, DialogContent, useTheme } from '@material-ui/core'
import { DialogTopBar } from '../navigation/DialogTopBar'
import { useCSS } from '../common/utils'
import { SelectableTagList } from './tagList/SelectableTagList'

export const TagsSelectionDialog: FC<{
  onItemClick: (id: { id: string, selected: boolean }) => void,
  data: { id: string, selected: boolean }[],
  onClose: () => void,
  open: boolean
  title?: string,
}> = ({ onItemClick, data, onClose, open, title = `Tags selection` }) => {
  const styles = useStyles()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
    >
      <DialogTopBar title={title} onClose={onClose} />
      <DialogContent style={styles.container}>
        <div style={styles.listContainer}>
          <SelectableTagList
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