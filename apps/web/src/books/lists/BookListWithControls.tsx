import type React from "react"
import { memo, useCallback, type ComponentProps } from "react"
import { ListActionsToolbar } from "../../common/lists/ListActionsToolbar"
import { BookList } from "./BookList"
import { Stack } from "@mui/material"
import { useLiveRef } from "reactjrx"

const style = {
  height: "100%",
  width: "100%",
}

export const BookListWithControls = memo(function BookListWithControls({
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
  ComponentProps<typeof BookList>) {
  const onViewModeChangeRef = useLiveRef(onViewModeChange)
  const onSortingChangeRef = useLiveRef(onSortingChange)

  const _renderHeader = useCallback(() => {
    return (
      <>
        {renderHeader?.()}
        <ListActionsToolbar
          viewMode={viewMode ?? "grid"}
          onViewModeChange={(...params) =>
            onViewModeChangeRef.current?.(...params)
          }
          sorting={sorting ?? "alpha"}
          onSortingChange={(...params) =>
            onSortingChangeRef.current?.(...params)
          }
          {...ListActionsToolbarProps}
        />
      </>
    )
  }, [
    renderHeader,
    ListActionsToolbarProps,
    viewMode,
    sorting,
    onViewModeChangeRef,
    onSortingChangeRef,
  ])

  return (
    <Stack
      sx={{
        flex: 1,
      }}
    >
      {data.length === 0 && !!renderEmptyList && (
        <>
          {_renderHeader()}
          {renderEmptyList}
        </>
      )}
      {data.length > 0 && (
        <BookList
          data={data}
          viewMode={viewMode}
          renderHeader={_renderHeader}
          style={style}
          {...rest}
        />
      )}
    </Stack>
  )
})
