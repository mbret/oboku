import { memo } from "react"
import {
  IconButton,
  InputAdornment,
  TextField,
  Toolbar as MuiToolbar,
} from "@mui/material"
import { ClearRounded, SearchRounded } from "@mui/icons-material"

export type SelectionListFilterProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  /**
   * Matches `SelectionToolbar`'s variant prop so callers can stack both
   * toolbars with the same height/gutters.
   */
  variant?: "regular" | "dense"
  /**
   * Optional label announced to assistive tech. Defaults to the placeholder
   * so screen readers still get a meaningful description even when the
   * placeholder text is the only visual hint.
   */
  ariaLabel?: string
}

/**
 * Thin search field designed to filter a selectable list (tags,
 * collections, books, ...). Content-agnostic: parents own the query
 * state and decide how to match it against their items.
 *
 * Wraps the input in `MuiToolbar` so it shares gutters and height
 * conventions with `SelectionToolbar` when both are stacked.
 */
export const SelectionListFilter = memo(function SelectionListFilter({
  value,
  onChange,
  placeholder = "Search…",
  autoFocus,
  variant = "regular",
  ariaLabel,
}: SelectionListFilterProps) {
  return (
    <MuiToolbar variant={variant}>
      <TextField
        fullWidth
        size="small"
        variant="outlined"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        slotProps={{
          htmlInput: {
            "aria-label": ariaLabel ?? placeholder,
          },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: value ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  edge="end"
                  onClick={() => onChange("")}
                  aria-label="Clear search"
                >
                  <ClearRounded fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
      />
    </MuiToolbar>
  )
})
