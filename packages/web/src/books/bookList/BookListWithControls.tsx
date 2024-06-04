import React, { ComponentProps, FC } from "react"
import {
  ListActionsToolbar,
} from "../../common/lists/ListActionsToolbar"
import { useBookIdsSortedBy } from "../helpers"
import { BookList } from "./BookList"

export const BookListWithControls: FC<
  {
    data: string[]
    renderEmptyList?: React.ReactNode
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
        viewMode={viewMode ?? "grid"}
        onViewModeChange={onViewModeChange}
        sorting={sorting ?? "alpha"}
        onSortingChange={onSortingChange}
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
