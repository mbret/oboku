import { type ComponentProps, memo, useState } from "react"
import {
  Toolbar,
  type ToolbarProps,
  IconButton,
  Button,
  Badge,
  Box,
} from "@mui/material"
import {
  AppsRounded,
  FormatListBulletedRounded,
  ListRounded,
  SortRounded,
  TuneRounded,
} from "@mui/icons-material"
import { SortByDialog } from "../../books/lists"

export type ListActionSorting = ComponentProps<typeof SortByDialog>["value"]
export type ListActionViewMode = "grid" | "list" | "compact" | "horizontal"

const switchToViewModeLabels = {
  grid: "Show as grid",
  list: "Show as list",
  compact: "Show as compact list",
}

export const ViewModeIconButton = ({
  viewMode,
  onViewModeChange,
}: {
  viewMode: ListActionViewMode
  onViewModeChange?: (viewMode: ListActionViewMode) => void
}) => {
  const nextViewMode =
    viewMode === "compact" ? "grid" : viewMode === "list" ? "compact" : "list"

  return (
    <IconButton
      aria-label={switchToViewModeLabels[nextViewMode]}
      color="primary"
      onClick={function switchToNextViewMode() {
        onViewModeChange?.(nextViewMode)
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

export const FiltersIconButton = ({
  numberOfFiltersApplied,
  onClick,
}: {
  numberOfFiltersApplied: number
  onClick: () => void
}) => {
  const hasFiltersApplied = numberOfFiltersApplied > 0

  return (
    <IconButton
      aria-label={
        hasFiltersApplied
          ? `Show filters, ${numberOfFiltersApplied} applied`
          : "Show filters"
      }
      edge="start"
      onClick={onClick}
      size="large"
      color="primary"
    >
      {hasFiltersApplied ? (
        <Badge badgeContent={numberOfFiltersApplied}>
          <TuneRounded />
        </Badge>
      ) : (
        <TuneRounded />
      )}
    </IconButton>
  )
}

export const ListActionsToolbar = memo(function ListActionsToolbar({
  viewMode,
  onViewModeChange,
  onSortingChange,
  sorting,
  onFilterClick,
  numberOfFiltersApplied = 0,
  ...rest
}: {
  viewMode?: ListActionViewMode
  sorting?: ListActionSorting
  onViewModeChange?: (viewMode: ListActionViewMode) => void
  onSortingChange?: (sorting: ListActionSorting) => void
  numberOfFiltersApplied?: number
  onFilterClick?: () => void
} & ToolbarProps) {
  const [isSortingDialogOpened, setIsSortingDialogOpened] = useState(false)

  return (
    <>
      <Toolbar
        style={{
          boxSizing: "border-box",
        }}
        {...rest}
      >
        <Box
          sx={{
            flexGrow: 1,
          }}
        >
          {!!onFilterClick && (
            <FiltersIconButton
              numberOfFiltersApplied={numberOfFiltersApplied}
              onClick={onFilterClick}
            />
          )}
          {!!sorting && (
            <div
              style={{
                justifyContent: "flex-start",
                flexFlow: "row",
                display: "flex",
                alignItems: "center",
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
        </Box>
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
})
