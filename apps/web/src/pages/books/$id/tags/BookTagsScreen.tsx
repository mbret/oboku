import { memo } from "react"
import { useParams } from "react-router"
import { useMutation } from "@tanstack/react-query"
import type { TagsDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { NotFoundPage } from "../../../../common/NotFoundPage"
import {
  useAddTagToBook,
  useRemoveTagFromBook,
} from "../../../../books/helpers"
import { useBook } from "../../../../books/states"
import { useTags } from "../../../../tags/helpers"
import { SelectableTagList } from "../../../../tags/tagList/SelectableTagList"
import { EntitySelectionPage } from "../../../../common/selection"
import { notify, notifyError } from "../../../../notifications/toasts"

const getTagSearchableText = (tag: DeepReadonlyObject<TagsDocType>) =>
  tag.name ?? ""

const EMPTY_TAGS: DeepReadonlyObject<TagsDocType>[] = []
const listStyle = { flex: 1 }

type ScreenParams = {
  id: string
}

export const BookTagsScreen = memo(function BookTagsScreen() {
  const { id: bookId } = useParams<ScreenParams>()
  const { data: tags = EMPTY_TAGS } = useTags()
  const { data: book } = useBook({ id: bookId })
  const { mutateAsync: addTagToBook } = useAddTagToBook()
  const { mutateAsync: removeTagFromBook } = useRemoveTagFromBook()

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: async ({
      toAdd,
      toRemove,
    }: {
      toAdd: string[]
      toRemove: string[]
    }) => {
      if (!bookId) return
      await Promise.all([
        ...toAdd.map((tagId) => addTagToBook({ _id: bookId, tagId })),
        ...toRemove.map((tagId) => removeTagFromBook({ _id: bookId, tagId })),
      ])
    },
    onSuccess: () => {
      notify("actionSuccess")
    },
    onError: notifyError,
  })

  if (book === null) return <NotFoundPage />

  return (
    <EntitySelectionPage
      title="Manage tags"
      searchPlaceholder="Search tags…"
      searchAriaLabel="Search tags"
      items={tags}
      persistedIds={book?.tags}
      getSearchableText={getTagSearchableText}
      isSaving={isSaving}
      onSave={save}
      renderList={({ filteredIds, selectedItems, toggleSelection }) => (
        <SelectableTagList
          style={listStyle}
          data={filteredIds}
          selected={selectedItems}
          onItemClick={({ id: tagId }: { id: string; selected: boolean }) => {
            toggleSelection(tagId)
          }}
        />
      )}
    />
  )
})
