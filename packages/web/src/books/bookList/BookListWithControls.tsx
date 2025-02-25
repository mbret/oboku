import type React from "react"
import type { ComponentProps, FC } from "react"
import { ListActionsToolbar } from "../../common/lists/ListActionsToolbar"
import { useBookIdsSortedBy } from "../helpers"
import { BookList } from "./BookList"
import { Stack } from "@mui/material"

export const BookListWithControls: FC<
  {
    data: string[]
    renderEmptyList?: React.ReactNode
    ListActionsToolbarProps?: Partial<ComponentProps<typeof ListActionsToolbar>>
    useWindowScroll?: boolean
  } & Pick<
    ComponentProps<typeof ListActionsToolbar>,
    "viewMode" | "onViewModeChange" | "sorting" | "onSortingChange"
  >
> = ({
  data,
  renderEmptyList,
  sorting,
  viewMode,
  onViewModeChange,
  onSortingChange,
  ListActionsToolbarProps,
  useWindowScroll,
}) => {
  const sortedData = useBookIdsSortedBy(data, sorting)

  return (
    <Stack flex={1}>
      <Stack flex={1}>
        {sortedData.length === 0 && !!renderEmptyList && renderEmptyList}
        {sortedData.length > 0 && (
          <BookList
            data={sortedData}
            viewMode={viewMode}
            renderHeader={() => (
              <ListActionsToolbar
                viewMode={viewMode ?? "grid"}
                onViewModeChange={onViewModeChange}
                sorting={sorting ?? "alpha"}
                onSortingChange={onSortingChange}
                {...ListActionsToolbarProps}
              />
            )}
            useWindowScroll={useWindowScroll}
            style={{
              height: "100%",
              width: "100%",
            }}
          />
        )}
      </Stack>
    </Stack>
  )
}
