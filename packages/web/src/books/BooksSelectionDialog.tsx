import { FC } from "react"
import { Dialog, DialogContent, useTheme } from "@mui/material"
import { DialogTopBar } from "../navigation/DialogTopBar"
import { useCSS } from "../common/utils"
import { SelectableBookList } from "../books/bookList/SelectableBookList"
import { SelectionDialogBottom } from "../common/SelectionDialogBottom"

export const BooksSelectionDialog: FC<{
  onItemClick: (id: { id: string; selected: boolean }) => void
  data: { id: string; selected: boolean }[]
  onClose: () => void
  open: boolean
}> = ({ onItemClick, data, onClose, open }) => {
  const styles = useStyles()
  const numberOfItemsSelected = data.reduce(
    (acc, { selected }) => acc + (selected ? 1 : 0),
    0
  )

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
        <SelectionDialogBottom
          onClose={onClose}
          numberOfItemsSelected={numberOfItemsSelected}
        />
      </DialogContent>
    </Dialog>
  )
}

const useStyles = () => {
  const theme = useTheme()

  return useCSS(
    () => ({
      container: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        flex: 1,
        overflow: "hidden",
        padding: 0
      },
      listContainer: {
        padding: `0px ${theme.spacing(1)}`,
        flex: 1
      },
      list: {
        flex: 1,
        height: "100%"
      }
    }),
    [theme]
  )
}
