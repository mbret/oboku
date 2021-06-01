import { FC, useMemo } from 'react'
import { Dialog, DialogContent, useTheme } from '@material-ui/core'
import { DialogTopBar } from '../navigation/DialogTopBar'
import { useCSS } from '../common/utils'
import { SelectableCollectionList } from './list/SelectableCollectionList'
import { SelectionDialogBottom } from '../common/SelectionDialogBottom'

export const CollectionsSelectionDialog: FC<{
  onItemClick: (id: { id: string, selected: boolean }) => void,
  data: string[],
  onClose: () => void,
  selected: (item: string) => boolean,
  open: boolean
  title?: string,
  hasBackNavigation?: boolean
}> = ({ onItemClick, data, onClose, open, title = `Collections selection`, selected, hasBackNavigation }) => {
  const styles = useStyles()
  const normalizedData = useMemo(() => data.map(item => ({
    id: item,
    selected: selected(item)
  })), [data, selected])
  const numberOfItemsSelected = normalizedData.reduce((acc, { selected }) => acc + (selected ? 1 : 0), 0)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
    >
      <DialogTopBar title={title} onClose={onClose} hasBackNavigation={hasBackNavigation} />
      <DialogContent style={styles.container}>
        <div style={styles.listContainer}>
          <SelectableCollectionList
            style={styles.list}
            onItemClick={onItemClick}
            data={normalizedData}
          />
        </div>
        <SelectionDialogBottom onClose={onClose} numberOfItemsSelected={numberOfItemsSelected} />
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
    listContainer: {
      flex: 1,
    },
    list: {
      flex: 1,
      height: '100%',
    },
  }), [theme])
}