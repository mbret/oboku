import { memo, type ReactNode } from "react"
import { Button, Stack, styled } from "@mui/material"
import { SelectionListFilter } from "./SelectionListFilter"
import { SelectionToolbar } from "./SelectionToolbar"
import {
  useFilteredSelection,
  type UseFilteredSelectionOptions,
} from "./useFilteredSelection"
import type { ListFilterItem } from "./useListFilter"

const FillStack = styled(Stack)({
  flex: 1,
  minHeight: 0,
})

const SaveActionStack = styled(Stack)(({ theme }) => ({
  borderTop: `1px solid ${theme.palette.divider}`,
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
}))

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

export type EntitySelectionViewProps<T extends ListFilterItem> = {
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
  /**
   * Optional extra action(s) rendered on the trailing edge of the
   * selection toolbar (after the built-in select/unselect buttons).
   * Use to expose page-level actions that fit naturally with the
   * selection chrome — e.g. a "create new entity" affordance — without
   * stealing vertical space from the list.
   */
  toolbarActions?: ReactNode
  isSaving: boolean
  onSave: (changes: EntitySelectionSaveChanges) => void
} & UseFilteredSelectionOptions<T>

/**
 * Shared body for "manage X on a book" screens (tags, collections,
 * ...): fuzzy search field, select/unselect-filtered toolbar, a slot
 * for the entity-specific list, and a Save button that commits the
 * diff against `persistedIds`.
 *
 * Renders as a flex column intended to fill its parent. Page chrome
 * (`Page`, `TopBarNavigation`) is the host's responsibility — this
 * component only owns the selection body. Hosts can therefore swap the
 * body for an alternative state (e.g. a `ProtectedContentGuard` notice)
 * without duplicating chrome on each branch.
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
export const EntitySelectionView = memo(function EntitySelectionView<
  T extends ListFilterItem,
>({
  searchPlaceholder,
  searchAriaLabel,
  renderList,
  toolbarActions,
  isSaving,
  onSave,
  items,
  persistedIds,
  entityKey,
  getSearchableText,
  debounceMs,
  fuseOptions,
}: EntitySelectionViewProps<T>) {
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
    entityKey,
    getSearchableText,
    debounceMs,
    fuseOptions,
  })

  return (
    <FillStack>
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
        actions={toolbarActions}
      />
      <FillStack>
        {renderList({ filteredIds, selectedItems, toggleSelection })}
      </FillStack>
      <SaveActionStack>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={!hasChanges || isSaving}
          onClick={() => onSave({ toAdd, toRemove })}
        >
          Save
        </Button>
      </SaveActionStack>
    </FillStack>
  )
  // `memo` strips the generic parameter from the wrapped component
  // (its public type collapses to a non-generic `MemoExoticComponent`).
  // Re-cast so callers keep inference between `items` and
  // `getSearchableText`. No runtime impact.
}) as unknown as <T extends ListFilterItem>(
  props: EntitySelectionViewProps<T>,
) => ReactNode
