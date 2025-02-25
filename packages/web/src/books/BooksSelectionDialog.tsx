import { type ComponentProps, memo } from "react"
import { Dialog, DialogContent } from "@mui/material"
import { DialogTopBar } from "../navigation/DialogTopBar"
import { SelectableBookList } from "../books/bookList/SelectableBookList"
import { SelectionDialogBottom } from "../common/SelectionDialogBottom"

export const BooksSelectionDialog = memo(
  ({
    data,
    onClose,
    open,
    selected,
    ...rest
  }: {
    onClose: () => void
    open: boolean
  } & ComponentProps<typeof SelectableBookList>) => {
    const numberOfItemsSelected =
      data?.reduce((acc, item) => acc + (selected[item] ? 1 : 0), 0) ?? 0

    return (
      <Dialog open={open} onClose={onClose} fullScreen>
        <DialogTopBar title="Manage books" onClose={onClose} />
        <DialogContent
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            flex: 1,
            overflow: "hidden",
            padding: 0,
          }}
        >
          <SelectableBookList
            style={{
              flex: 1,
              height: "100%",
            }}
            data={data}
            selected={selected}
            {...rest}
          />
          <SelectionDialogBottom
            onClose={onClose}
            numberOfItemsSelected={numberOfItemsSelected}
          />
        </DialogContent>
      </Dialog>
    )
  },
)
