import { SortRounded, CloseRounded } from "@mui/icons-material"
import { Button, Toolbar as MuiToolbar, Stack } from "@mui/material"
import {
  FiltersIconButton,
  ViewModeIconButton,
} from "../../common/lists/ListActionsToolbar"
import { libraryStateSignal } from "./states"
import { useSignalValue } from "reactjrx"

export const Toolbar = ({
  onFilterClick,
  onSortClick,
  onClearFilterClick,
  numberOfFiltersApplied,
}: {
  onFilterClick: () => void
  onClearFilterClick: () => void
  onSortClick: () => void
  numberOfFiltersApplied: number
}) => {
  const library = useSignalValue(libraryStateSignal)

  return (
    <MuiToolbar>
      <FiltersIconButton
        numberOfFiltersApplied={numberOfFiltersApplied}
        onClick={onFilterClick}
      />
      <Stack
        sx={{
          flexGrow: 1,
          justifyContent: "flex-start",
          flexDirection: "row",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Button
          variant="text"
          onClick={onSortClick}
          startIcon={<SortRounded />}
        >
          {library.sorting === "activity"
            ? "Recent activity"
            : library.sorting === "alpha"
              ? "A > Z"
              : "Date added"}
        </Button>
        {numberOfFiltersApplied > 0 && (
          <Button
            sx={{ ml: 2 }}
            size="small"
            color="error"
            startIcon={<CloseRounded />}
            onClick={onClearFilterClick}
          >
            Clear filters
          </Button>
        )}
      </Stack>
      <ViewModeIconButton
        viewMode={library.viewMode}
        onViewModeChange={(value) => {
          libraryStateSignal.update((state) => ({
            ...state,
            viewMode: value,
          }))
        }}
      />
    </MuiToolbar>
  )
}
