import { memo, useCallback } from "react"
import { useParams } from "react-router"
import { Stack } from "@mui/material"
import { Page } from "../../../../common/Page"
import { TopBarNavigation } from "../../../../navigation/TopBarNavigation"
import { NotFoundPage } from "../../../../common/NotFoundPage"
import {
  useAddTagToBook,
  useRemoveTagFromBook,
} from "../../../../books/helpers"
import { useBook } from "../../../../books/states"
import { useTagIds } from "../../../../tags/helpers"
import { SelectableTagList } from "../../../../tags/tagList/SelectableTagList"

type ScreenParams = {
  id: string
}

const listStyle = { flex: 1 }

export const BookTagsScreen = memo(function BookTagsScreen() {
  const { id: bookId } = useParams<ScreenParams>()
  const { data: tagIds = [] } = useTagIds()
  const { data: book } = useBook({ id: bookId })
  const { mutate: addTagToBook } = useAddTagToBook()
  const { mutate: removeTagFromBook } = useRemoveTagFromBook()

  const onItemClick = useCallback(
    ({ id: tagId, selected }: { id: string; selected: boolean }) => {
      if (!bookId) return
      if (selected) {
        removeTagFromBook({ _id: bookId, tagId })
      } else {
        addTagToBook({ _id: bookId, tagId })
      }
    },
    [addTagToBook, removeTagFromBook, bookId],
  )

  if (book === null) return <NotFoundPage />

  const selectedMap = (book?.tags ?? []).reduce<Record<string, boolean>>(
    (acc, id) => {
      acc[id] = true
      return acc
    },
    {},
  )

  return (
    <Page sx={{ overflow: "hidden" }} bottomGutter={false}>
      <TopBarNavigation title="Manage tags" showBack />
      <Stack sx={{ flex: 1, minHeight: 0 }}>
        <SelectableTagList
          style={listStyle}
          data={tagIds}
          selected={selectedMap}
          onItemClick={onItemClick}
        />
      </Stack>
    </Page>
  )
})
