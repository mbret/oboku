import type React from "react"
import { memo, useMemo, type ComponentProps } from "react"
import { ListActionsToolbar } from "../../common/lists/ListActionsToolbar"
import { useBookIdsSortedBy } from "../helpers"
import { BookList } from "./BookList"
import { Stack } from "@mui/material"

const style = {
  height: "100%",
  width: "100%",
}

export const BookListWithControls = memo(
  ({
    data,
    renderEmptyList,
    sorting,
    viewMode,
    onViewModeChange,
    onSortingChange,
    ListActionsToolbarProps,
    renderHeader,
    ...rest
  }: {
    data: string[]
    renderEmptyList?: React.ReactNode
    ListActionsToolbarProps?: Partial<ComponentProps<typeof ListActionsToolbar>>
  } & Pick<
    ComponentProps<typeof ListActionsToolbar>,
    "viewMode" | "onViewModeChange" | "sorting" | "onSortingChange"
  > &
    ComponentProps<typeof BookList>) => {
    const sortedData = useBookIdsSortedBy(data, sorting)

    const _renderHeader = useMemo(
      () => () => {
        return (
          <>
            {renderHeader?.()}
            <ListActionsToolbar
              viewMode={viewMode ?? "grid"}
              onViewModeChange={onViewModeChange}
              sorting={sorting ?? "alpha"}
              onSortingChange={onSortingChange}
              {...ListActionsToolbarProps}
            />
          </>
        )
      },
      [
        renderHeader,
        ListActionsToolbarProps,
        viewMode,
        sorting,
        onViewModeChange,
        onSortingChange,
      ],
    )

    return (
      <Stack flex={1}>
        {sortedData.length === 0 && !!renderEmptyList && (
          <>
            {_renderHeader()}
            {renderEmptyList}
          </>
        )}
        {sortedData.length > 0 && (
          <BookList
            data={sortedData}
            viewMode={viewMode}
            renderHeader={_renderHeader}
            style={style}
            {...rest}
          />
        )}
      </Stack>
    )
  },
)
