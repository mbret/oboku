import { memo, type CSSProperties } from "react"
import type { BookDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { BookList } from "./lists"
import { EmptyList } from "../common/lists/EmptyList"
import {
  EntitySelectionView,
  type EntitySelectionSaveChanges,
} from "../common/selection"
import { useBooks } from "./states"
import { getMetadataFromBook } from "./metadata"

const bookListStyle = {
  height: "100%",
} satisfies CSSProperties

const EMPTY_BOOKS: DeepReadonlyObject<BookDocType>[] = []

const getBookSearchableText = (book: DeepReadonlyObject<BookDocType>) => {
  const { title, authors } = getMetadataFromBook(book)
  return [title, ...(authors ?? [])]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
}

export type BookSelectionSaveChanges = EntitySelectionSaveChanges

export type BookSelectionViewProps = {
  /**
   * Persisted baseline book ids for the target entity. Pass `undefined`
   * while the entity is still resolving so the selection is not seeded
   * yet and the add/remove diff stays empty.
   */
  persistedBookIds: readonly string[] | undefined
  /**
   * Stable id of the parent entity owning the books (e.g. `tagId`,
   * `collectionId`). Required so navigating between same-route ids
   * (`/tag/A/books` → `/tag/B/books`) reseeds from the new entity's
   * `persistedBookIds` instead of carrying the previous entity's
   * pending edits over.
   */
  entityKey: string
  isSaving: boolean
  onSave: (changes: BookSelectionSaveChanges) => void
}

/**
 * Shared body for associating a set of books with a parent entity
 * (e.g. a tag or a collection). The parent-specific data fetching and
 * save mutation live in the caller; this component owns the books data
 * source, the searchable text projection, and the empty-state rendering
 * around the {@link EntitySelectionView} body.
 *
 * Renders as a flex column intended to fill its parent. Page chrome
 * (`Page`, `TopBarNavigation`) is the host's responsibility — see
 * `EntitySelectionView` for the rationale.
 *
 * Per-entity writes go straight to the local RxDB instance from the
 * caller's `onSave` and are fired in parallel. React Query does not
 * cancel in-flight `mutationFn`s on unmount, so the writes still commit
 * locally (and replicate in the background) even if the user hits back
 * mid-save. Success/error toasts are global, so they surface on whatever
 * screen the user lands on.
 *
 * For that reason we intentionally do NOT disable the back button while
 * `isSaving` — the toolbar's select/unselect and the footer's Save
 * button are disabled via `isSaving`, but navigating away is safe and
 * we rely on optimistic-update semantics instead of intercepting it.
 */
export const BookSelectionView = memo(function BookSelectionView({
  persistedBookIds,
  entityKey,
  isSaving,
  onSave,
}: BookSelectionViewProps) {
  const { data: books = EMPTY_BOOKS } = useBooks()

  return (
    <EntitySelectionView
      searchPlaceholder="Search books…"
      searchAriaLabel="Search books"
      items={books}
      persistedIds={persistedBookIds}
      entityKey={entityKey}
      getSearchableText={getBookSearchableText}
      isSaving={isSaving}
      onSave={onSave}
      renderList={({ filteredIds, selectedItems, toggleSelection }) =>
        filteredIds.length === 0 ? (
          <EmptyList />
        ) : (
          <BookList
            viewMode="list"
            data={filteredIds}
            style={bookListStyle}
            selectionMode
            selected={selectedItems}
            onSelectionStart={toggleSelection}
            onSelectionToggle={toggleSelection}
          />
        )
      }
    />
  )
})
