import React, { ComponentProps, FC, useState } from "react"
import { Toolbar, IconButton, useTheme, Button, Badge } from "@mui/material"
import {
  AppsRounded,
  ListRounded,
  LockOpenRounded,
  SortRounded,
  TuneRounded
} from "@mui/icons-material"
import { SortByDialog } from "../../books/bookList/SortByDialog"
import { useSignalValue } from "reactjrx"
import { libraryStateSignal } from "../../library/states"
import { BookListViewMode } from "../../books/bookList/types"

export type Sorting = ComponentProps<typeof SortByDialog>["value"]

export const ListActionsToolbar: FC<{
  viewMode?: BookListViewMode
  sorting?: Sorting
  onViewModeChange?: (viewMode: "list" | "grid") => void
  onSortingChange?: (sorting: Sorting) => void
  numberOfFiltersApplied?: number
  onFilterClick?: () => void
}> = ({
  viewMode,
  onViewModeChange,
  onSortingChange,
  sorting,
  onFilterClick,
  numberOfFiltersApplied = 0
}) => {
  const theme = useTheme()
  const library = useSignalValue(libraryStateSignal)
  const [isSortingDialogOpened, setIsSortingDialogOpened] = useState(false)

  return (
    <>
      <Toolbar
        style={{
          borderBottom: `1px solid ${theme.palette.grey[200]}`,
          boxSizing: "border-box"
        }}
      >
        {!!onFilterClick && (
          <IconButton
            edge="start"
            onClick={() => onFilterClick && onFilterClick()}
            size="large"
            color="primary"
          >
            {numberOfFiltersApplied > 0 ? (
              <Badge badgeContent={numberOfFiltersApplied}>
                <TuneRounded />
              </Badge>
            ) : (
              <TuneRounded />
            )}
          </IconButton>
        )}
        {!!sorting && (
          <div
            style={{
              flexGrow: 1,
              justifyContent: "flex-start",
              flexFlow: "row",
              display: "flex",
              alignItems: "center"
            }}
          >
            <Button
              variant="text"
              onClick={() => setIsSortingDialogOpened(true)}
              startIcon={<SortRounded />}
            >
              {sorting === "activity"
                ? "Recent activity"
                : sorting === "alpha"
                  ? "A > Z"
                  : "Date added"}
            </Button>
          </div>
        )}
        {library.isLibraryUnlocked && (
          <div
            style={{
              display: "flex",
              flexFlow: "row",
              alignItems: "center",
              marginLeft: theme.spacing(1),
              overflow: "hidden"
            }}
          >
            <LockOpenRounded fontSize="small" />
          </div>
        )}
        {!!viewMode && (
          <IconButton
            color="primary"
            onClick={() => {
              onViewModeChange?.(viewMode === "grid" ? "list" : "grid")
            }}
            size="large"
          >
            {viewMode === "grid" ? <AppsRounded /> : <ListRounded />}
          </IconButton>
        )}
      </Toolbar>
      <SortByDialog
        value={sorting}
        onClose={() => setIsSortingDialogOpened(false)}
        open={isSortingDialogOpened}
        onChange={onSortingChange}
      />
    </>
  )
}
