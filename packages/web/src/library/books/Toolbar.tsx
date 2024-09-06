import { TuneRounded, SortRounded, CloseRounded } from "@mui/icons-material"
import {
  Badge,
  Button,
  IconButton,
  Toolbar as MuiToolbar,
  Stack
} from "@mui/material"
import { ViewModeIconButton } from "../../common/lists/ListActionsToolbar"
import { libraryStateSignal } from "./states"
import { useSignalValue } from "reactjrx"

export const Toolbar = ({
  onFilterClick,
  onSortClick,
  onClearFilterClick,
  numberOfFiltersApplied
}: {
  onFilterClick: () => void
  onClearFilterClick: () => void
  onSortClick: () => void
  numberOfFiltersApplied: number
}) => {
  const library = useSignalValue(libraryStateSignal)

  return (
    <MuiToolbar
      sx={(theme) => ({
        borderBottom: `1px solid ${theme.palette.grey[200]}`,
        boxSizing: "border-box"
      })}
    >
      <IconButton
        edge="start"
        onClick={onFilterClick}
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
      <Stack
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
          libraryStateSignal.setValue((state) => ({
            ...state,
            viewMode: value
          }))
        }}
      />
    </MuiToolbar>
  )
}
