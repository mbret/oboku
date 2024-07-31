import { ComponentProps, useMemo } from "react"
import { Dialog, DialogContent, useTheme } from "@mui/material"
import { DialogTopBar } from "../navigation/DialogTopBar"
import { useCSS } from "../common/utils"
import { SelectableTagList } from "./tagList/SelectableTagList"
import { SelectionDialogBottom } from "../common/SelectionDialogBottom"

export const TagsSelectionDialog = ({
  onItemClick,
  data,
  onClose,
  open,
  title = `Tags selection`,
  selected,
  hasBackNavigation
}: {
  onClose: () => void
  selected: (item: string) => boolean
  open: boolean
  title?: string
  hasBackNavigation?: boolean
} & ComponentProps<typeof SelectableTagList>) => {
  const styles = useStyles()
  const selectedData = useMemo(
    () =>
      data?.reduce(
        (acc, item) => ({
          ...acc,
          [item]: selected(item)
        }),
        {} as Record<string, boolean>
      ) ?? {},
    [data, selected]
  )

  const numberOfItemsSelected =
    data?.reduce((acc, item) => acc + (selected(item) ? 1 : 0), 0) ?? 0

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <DialogTopBar
        title={title}
        onClose={onClose}
        hasBackNavigation={hasBackNavigation}
      />
      <DialogContent
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 0
        }}
      >
        <SelectableTagList
          style={{
            flex: 1
          }}
          onItemClick={onItemClick}
          data={data}
          selected={selectedData}
        />
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
      }
    }),
    [theme]
  )
}
