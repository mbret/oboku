import { Box, Button, Stack } from "@mui/material"
import { memo, useEffect, useRef, type CSSProperties } from "react"
import type { BookDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { Page } from "../common/Page"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { BookList } from "./lists"
import { EmptyList } from "../common/lists/EmptyList"
import { SelectionToolbar, useSelectionState } from "../common/selection"
import { useBooks } from "./states"

const bookListStyle = {
  height: "100%",
} satisfies CSSProperties

const EMPTY_IDS: string[] = []

const selectBookIds = (items: DeepReadonlyObject<BookDocType>[]) =>
  items.map(({ _id }) => _id)

export type BookSelectionSaveChanges = {
  toAdd: string[]
  toRemove: string[]
}

export type BookSelectionPageProps = {
  title: string
  /**
   * Persisted baseline book ids for the target entity. Pass `undefined`
   * while the entity is still resolving so the selection is not seeded
   * yet and the add/remove diff stays empty.
   */
  persistedBookIds: readonly string[] | undefined
  isSaving: boolean
  onSave: (changes: BookSelectionSaveChanges) => void
}

/**
 * Shared page for associating a set of books with a parent entity
 * (e.g. a tag or a collection). The parent-specific data fetching and
 * save mutation live in the caller; this component owns the selection
 * state, toolbar, list, seeding, and footer Save button.
 *
 * Per-entity writes go straight to the local RxDB instance from the
 * caller's `onSave` and are fired in parallel. React Query does not
 * cancel in-flight `mutationFn`s on unmount, so the writes still commit
 * locally (and replicate in the background) even if the user hits back
 * mid-save. Success/error toasts are global, so they surface on whatever
 * screen the user lands on.
 *
 * For that reason we intentionally do NOT disable `TopBarNavigation`'s
 * back button while `isSaving` — the toolbar's select/unselect and the
 * footer's Save button are disabled via `isSaving`, but navigating away
 * is safe and we rely on optimistic-update semantics instead of
 * intercepting it.
 */
export const BookSelectionPage = memo(function BookSelectionPage({
  title,
  persistedBookIds,
  isSaving,
  onSave,
}: BookSelectionPageProps) {
  const { data: bookIds = EMPTY_IDS } = useBooks({ select: selectBookIds })

  const {
    clearSelection: unselectAll,
    hasChanges,
    selectAll,
    selectedCount,
    selectedItems: selected,
    setSelection,
    toAdd,
    toggleSelection,
    toRemove,
  } = useSelectionState(bookIds, {
    initialSelectedIds: persistedBookIds ?? EMPTY_IDS,
  })

  const hasSeededRef = useRef(false)

  /**
   * The parent entity resolves asynchronously, so `persistedBookIds` is
   * first `undefined` on initial render. Seed the selection exactly once,
   * on the transition from "unresolved" to "resolved", so later upstream
   * re-emissions (e.g. remote writes via replication, or another writer
   * mutating the same entity) don't clobber the user's in-progress
   * selection.
   */
  useEffect(
    function seedSelectionOnceResolved() {
      if (hasSeededRef.current) return
      if (persistedBookIds === undefined) return
      setSelection(persistedBookIds)
      hasSeededRef.current = true
    },
    [persistedBookIds, setSelection],
  )

  return (
    <Page sx={{ overflow: "hidden" }} bottomGutter={false}>
      <TopBarNavigation title={title} showBack />
      <SelectionToolbar
        variant="dense"
        selectionCount={selectedCount}
        totalCount={bookIds.length}
        isActionPending={isSaving}
        onSelectAll={selectAll}
        onUnselectAll={unselectAll}
      />
      <Stack
        sx={{
          flex: 1,
          minHeight: 0,
        }}
      >
        {bookIds.length === 0 ? (
          <EmptyList />
        ) : (
          <BookList
            viewMode="list"
            data={bookIds}
            style={bookListStyle}
            selectionMode
            selected={selected}
            onSelectionStart={toggleSelection}
            onSelectionToggle={toggleSelection}
          />
        )}
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
})
