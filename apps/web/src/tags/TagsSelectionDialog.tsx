import { type ComponentProps, useMemo } from "react"
import { Dialog, DialogContent } from "@mui/material"
import { DialogTopBar } from "../navigation/DialogTopBar"
import { SelectableTagList } from "./tagList/SelectableTagList"
import { SelectionDialogBottom } from "../common/SelectionDialogBottom"

export const TagsSelectionDialog = ({
  onItemClick,
  data,
  onClose,
  open,
  title = `Tags selection`,
  selected,
  hasBackNavigation,
}: {
  onClose: () => void
  selected: (item: string) => boolean
  open: boolean
  title?: string
  hasBackNavigation?: boolean
} & Omit<ComponentProps<typeof SelectableTagList>, "selected">) => {
  // React Compiler cannot lower this function yet, so it bails out here.
  // TODO: re-check on a newer React Compiler; drop this opt-out once it compiles.
  "use no memo"

  const selectedData = useMemo(
    () =>
      data?.reduce(
        (acc, item) => ({
          ...acc,
          [item]: selected(item),
        }),
        {} as Record<string, boolean>,
      ) ?? {},
    [data, selected],
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
          padding: 0,
        }}
      >
        <SelectableTagList
          style={{
            flex: 1,
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
