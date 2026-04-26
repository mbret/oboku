import { memo, type ReactNode } from "react"
import { Box, Button, Stack } from "@mui/material"
import { Page } from "../Page"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { SelectionListFilter } from "./SelectionListFilter"
import { SelectionToolbar } from "./SelectionToolbar"
import {
  useFilteredSelection,
  type UseFilteredSelectionOptions,
} from "./useFilteredSelection"
import type { ListFilterItem } from "./useListFilter"

export type EntitySelectionSaveChanges = {
  toAdd: string[]
  toRemove: string[]
}

export type EntitySelectionRenderListProps = {
  /**
   * Currently visible item ids after fuzzy filtering. Pass straight to
   * the list component as its `data` prop.
   */
  filteredIds: string[]
  /**
   * Selection map keyed by item id. Pass straight to the list component
   * as its `selected` prop.
   */
  selectedItems: Record<string, true>
  /**
   * Toggle the selection state for a single id. Wire to the list's
   * click handler.
   */
  toggleSelection: (id: string) => void
}

export type EntitySelectionPageProps<T extends ListFilterItem> = {
  /** Title shown in the top bar (e.g. "Manage tags"). */
  title: string
  /** Search input placeholder (e.g. "Search tags…"). */
  searchPlaceholder: string
  /**
   * Accessible label for the search input. Falls back to the placeholder
   * when omitted; provided explicitly here to keep call sites symmetric.
   */
  searchAriaLabel: string
  /**
   * Render the entity-specific list. The shell owns selection/filter
   * state and passes back ready-to-use props; the caller picks the
   * concrete `Selectable*List` and wires its idiosyncratic API.
   */
  renderList: (props: EntitySelectionRenderListProps) => ReactNode
  isSaving: boolean
  onSave: (changes: EntitySelectionSaveChanges) => void
} & UseFilteredSelectionOptions<T>

/**
 * Shared chrome for "manage X on a book" screens (tags, collections,
 * ...): top bar, fuzzy search field, select/unselect-filtered toolbar,
 * a slot for the entity-specific list, and a Save button that commits
 * the diff against `persistedIds`.
 *
 * Each call site keeps full ownership of:
 * - the data hook (`useTags`, `useCollections`, ...)
 * - the mutation(s) backing `onSave`
 * - the `Selectable*List` component (with its specific prop shape)
 *
 * The selection state and filter wiring live here so the chrome stays
 * consistent and tweaks (placeholder copy, toolbar spacing, save button
 * styling) land in one place.
 */
export const EntitySelectionPage = memo(function EntitySelectionPage<
  T extends ListFilterItem,
>({
  title,
  searchPlaceholder,
  searchAriaLabel,
  renderList,
  isSaving,
  onSave,
  items,
  persistedIds,
  getSearchableText,
  debounceMs,
  fuseOptions,
}: EntitySelectionPageProps<T>) {
  const {
    query,
    setQuery,
    filteredIds,
    selectedItems,
    toggleSelection,
    filteredSelectedCount,
    filteredTotalCount,
    selectFiltered,
    unselectFiltered,
    hasChanges,
    toAdd,
    toRemove,
  } = useFilteredSelection({
    items,
    persistedIds,
    getSearchableText,
    debounceMs,
    fuseOptions,
  })

  return (
    <Page sx={{ overflow: "hidden" }} bottomGutter={false}>
      <TopBarNavigation title={title} showBack />
      <SelectionListFilter
        value={query}
        onChange={setQuery}
        placeholder={searchPlaceholder}
        ariaLabel={searchAriaLabel}
      />
      <SelectionToolbar
        variant="dense"
        selectionCount={filteredSelectedCount}
        totalCount={filteredTotalCount}
        isActionPending={isSaving}
        onSelectAll={selectFiltered}
        onUnselectAll={unselectFiltered}
      />
      <Stack sx={{ flex: 1, minHeight: 0 }}>
        {renderList({ filteredIds, selectedItems, toggleSelection })}
      </Stack>
      <Box
        sx={{
          borderTop: 1,
          borderColor: "divider",
          px: 2,
          py: 1.5,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={!hasChanges || isSaving}
          onClick={() => onSave({ toAdd, toRemove })}
        >
          Save
        </Button>
      </Box>
    </Page>
  )
  // `memo` strips the generic parameter from the wrapped component
  // (its public type collapses to a non-generic `MemoExoticComponent`).
  // Re-cast so callers keep inference between `items` and
  // `getSearchableText`. No runtime impact.
}) as unknown as <T extends ListFilterItem>(
  props: EntitySelectionPageProps<T>,
) => ReactNode
