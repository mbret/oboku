import { ComponentProps, FC, useState } from "react"
import { Toolbar, IconButton, useTheme, Button, Badge } from "@mui/material"
import {
  AppsRounded,
  FormatListBulletedRounded,
  ListRounded,
  LockOpenRounded,
  SortRounded,
  TuneRounded
} from "@mui/icons-material"
import { SortByDialog } from "../../books/bookList/SortByDialog"
import { useSignalValue } from "reactjrx"
import { libraryStateSignal } from "../../library/states"

export type ListActionSorting = ComponentProps<typeof SortByDialog>["value"]
export type ListActionViewMode = "grid" | "list" | "compact"

export const ViewModeIconButton = ({
  viewMode,
  onViewModeChange
}: {
  viewMode: ListActionViewMode
  onViewModeChange?: (viewMode: ListActionViewMode) => void
}) => {
  return (
    <IconButton
      color="primary"
      onClick={() => {
        const newViewMode =
          viewMode === "compact"
            ? "grid"
            : viewMode === "list"
              ? "compact"
              : "list"

        onViewModeChange?.(newViewMode)
      }}
      size="large"
    >
      {viewMode === "grid" ? (
        <AppsRounded />
      ) : viewMode === "list" ? (
        <FormatListBulletedRounded />
      ) : (
        <ListRounded />
      )}
    </IconButton>
  )
}

export const ListActionsToolbar: FC<{
  viewMode?: ListActionViewMode
  sorting?: ListActionSorting
  onViewModeChange?: (viewMode: ListActionViewMode) => void
  onSortingChange?: (sorting: ListActionSorting) => void
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
          <ViewModeIconButton
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />
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
