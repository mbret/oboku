import { type ComponentProps, memo, useMemo } from "react"
import { Dialog, DialogContent } from "@mui/material"
import { DialogTopBar } from "../navigation/DialogTopBar"
import { SelectableCollectionList } from "./lists/SelectableCollectionList"
import { SelectionDialogBottom } from "../common/SelectionDialogBottom"

export const CollectionsSelectionDialog = memo(
  ({
    onItemClick,
    data,
    onClose,
    open,
    title = `Collections selection`,
    selected,
    hasBackNavigation,
  }: {
    onItemClick: (id: { id: string; selected: boolean }) => void
    onClose: () => void
    selected: (item: string) => boolean
    open: boolean
    title?: string
    hasBackNavigation?: boolean
  } & Omit<ComponentProps<typeof SelectableCollectionList>, "selected">) => {
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
          <SelectableCollectionList
            style={{
              flex: 1,
            }}
            onItemClick={onItemClick}
            selected={selectedData}
            data={data}
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
