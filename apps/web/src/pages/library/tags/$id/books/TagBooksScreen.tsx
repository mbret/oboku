import { Box, Button, Stack } from "@mui/material"
import { Page } from "../../../../../common/Page"
import { memo, useEffect, useRef, type CSSProperties } from "react"
import { useParams } from "react-router"
import { useMutation } from "@tanstack/react-query"
import { TopBarNavigation } from "../../../../../navigation/TopBarNavigation"
import { BookList } from "../../../../../books/lists"
import { EmptyList } from "../../../../../common/lists/EmptyList"
import {
  SelectionToolbar,
  useSelectionState,
} from "../../../../../common/selection"
import { useBooks } from "../../../../../books/states"
import {
  useAddTagToBook,
  useRemoveTagFromBook,
} from "../../../../../books/helpers"
import { useTag } from "../../../../../tags/helpers"
import { notify, notifyError } from "../../../../../notifications/toasts"
import { NotFoundPage } from "../../../../../common/NotFoundPage"
import type { BookDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"

const bookListStyle = {
  height: "100%",
} satisfies CSSProperties

type ScreenParams = {
  id: string
}

const EMPTY_IDS: string[] = []

const selectBookIds = (items: DeepReadonlyObject<BookDocType>[]) =>
  items.map(({ _id }) => _id)

export const TagBooksScreen = memo(function TagBooksScreen() {
  const { id: tagId } = useParams<ScreenParams>()
  const { data: tag } = useTag(tagId)
  const tagName = tag?.name
  const persistedBookIds = tag?.books ?? EMPTY_IDS
  const { data: bookIds = EMPTY_IDS } = useBooks({ select: selectBookIds })
  const { mutateAsync: addTagToBook } = useAddTagToBook()
  const { mutateAsync: removeTagFromBook } = useRemoveTagFromBook()

  /**
   * Per-book writes go straight to the local RxDB instance and are fired in
   * parallel as soon as `save` runs. React Query does not cancel in-flight
   * `mutationFn`s on unmount, so the writes still commit locally (and replicate
   * in the background) even if the user hits back mid-save. Success/error
   * toasts are global, so they surface on whatever screen the user lands on.
   *
   * For that reason we intentionally do NOT disable `TopBarNavigation`'s back
   * button while `isSaving` — the toolbar's select/unselect and the footer's
   * Save button are disabled via `isActionPending`, but navigating away is
   * safe and we rely on optimistic-update semantics instead of intercepting it.
   */
  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: async ({
      toAdd,
      toRemove,
    }: {
      toAdd: string[]
      toRemove: string[]
    }) => {
      if (!tagId) return
      await Promise.all([
        ...toAdd.map((bookId) => addTagToBook({ _id: bookId, tagId })),
        ...toRemove.map((bookId) => removeTagFromBook({ _id: bookId, tagId })),
      ])
    },
    onSuccess: () => {
      notify("actionSuccess")
    },
    onError: notifyError,
  })

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
    initialSelectedIds: persistedBookIds,
  })

  const hasSeededRef = useRef(false)

  /**
   * `useTag` resolves asynchronously, so the hook is first seeded with `[]`
   * on initial render. Seed the selection exactly once, on the transition
   * from "unresolved" to "resolved", so later upstream re-emissions
   * (e.g. remote writes to `tag.books` via replication, or another writer
   * mutating the same tag) don't clobber the user's in-progress selection.
   */
  useEffect(
    function seedSelectionOnceResolved() {
      if (hasSeededRef.current) return
      if (persistedBookIds === EMPTY_IDS) return
      setSelection(persistedBookIds)
      hasSeededRef.current = true
    },
    [persistedBookIds, setSelection],
  )

  if (tag === null) return <NotFoundPage />

  return (
    <Page overflow="hidden" bottomGutter={false}>
      <TopBarNavigation title={`Manage ${tagName} books`} showBack />
      <SelectionToolbar
        variant="dense"
        selectionCount={selectedCount}
        totalCount={bookIds.length}
        isActionPending={isSaving}
        onSelectAll={selectAll}
        onUnselectAll={unselectAll}
      />
      <Stack flex={1} minHeight={0}>
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
      <Box borderTop={1} borderColor="divider" px={2} py={1.5}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={!hasChanges || isSaving}
          onClick={() => save({ toAdd, toRemove })}
        >
          Save
        </Button>
      </Box>
    </Page>
  )
})
