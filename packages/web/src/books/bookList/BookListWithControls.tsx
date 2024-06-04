import React, { ComponentProps, FC } from "react"
import { ListActionsToolbar } from "../../common/lists/ListActionsToolbar"
import { useBookIdsSortedBy } from "../helpers"
import { BookList } from "./BookList"
import { BookListViewMode } from "./types"

type Sorting = ComponentProps<typeof ListActionsToolbar>["sorting"]

export const BookListWithControls: FC<{
  data: string[]
  renderEmptyList?: React.ReactNode
  sorting?: Sorting
  viewMode?: BookListViewMode
  onViewModeChange?: (viewMode: BookListViewMode) => void
  onSortingChange?: (viewMode: Sorting) => void
}> = ({
  data,
  renderEmptyList,
  sorting = "date",
  viewMode = "grid",
  onViewModeChange,
  onSortingChange
}) => {
  const sortedData = useBookIdsSortedBy(data, sorting)

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        flex: 1,
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      <ListActionsToolbar
        viewMode={viewMode}
        onViewModeChange={(value) => {
          onViewModeChange && onViewModeChange(value)
        }}
        sorting={sorting}
        onSortingChange={(value) => {
          onSortingChange && onSortingChange(value)
        }}
      />
      <div
        style={{
          display: "flex",
          height: "100%",
          overflow: "scroll",
          flex: 1
        }}
      >
        {sortedData.length === 0 && !!renderEmptyList && renderEmptyList}
        {sortedData.length > 0 && (
          <BookList
            data={sortedData}
            viewMode={viewMode}
            style={{ height: "100%", width: "100%" }}
          />
        )}
      </div>
    </div>
  )
}
