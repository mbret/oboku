import { memo, useCallback, useMemo } from "react"
import { useParams } from "react-router"
import { Stack } from "@mui/material"
import { Page } from "../../../../common/Page"
import { TopBarNavigation } from "../../../../navigation/TopBarNavigation"
import { NotFoundPage } from "../../../../common/NotFoundPage"
import {
  useAddCollectionToBook,
  useRemoveCollectionFromBook,
} from "../../../../books/helpers"
import { useBook } from "../../../../books/states"
import { useCollections } from "../../../../collections/useCollections"
import { SelectableCollectionList } from "../../../../collections/lists/SelectableCollectionList"

type ScreenParams = {
  id: string
}

const listStyle = { flex: 1 }

export const BookCollectionsScreen = memo(function BookCollectionsScreen() {
  const { id: bookId } = useParams<ScreenParams>()
  const { data: collections = [] } = useCollections()
  const { data: book } = useBook({ id: bookId })
  const { mutate: addCollectionToBook } = useAddCollectionToBook()
  const { mutate: removeCollectionFromBook } = useRemoveCollectionFromBook()

  const collectionIds = useMemo(
    () => collections.map(({ _id }) => _id),
    [collections],
  )

  const onItemClick = useCallback(
    ({ id: collectionId, selected }: { id: string; selected: boolean }) => {
      if (!bookId) return
      if (selected) {
        removeCollectionFromBook({ _id: bookId, collectionId })
      } else {
        addCollectionToBook({ _id: bookId, collectionId })
      }
    },
    [addCollectionToBook, removeCollectionFromBook, bookId],
  )

  if (book === null) return <NotFoundPage />

  const selectedMap = (book?.collections ?? []).reduce<Record<string, boolean>>(
    (acc, id) => {
      acc[id] = true
      return acc
    },
    {},
  )

  return (
    <Page sx={{ overflow: "hidden" }} bottomGutter={false}>
      <TopBarNavigation title="Manage collections" showBack />
      <Stack sx={{ flex: 1, minHeight: 0 }}>
        <SelectableCollectionList
          style={listStyle}
          data={collectionIds}
          selected={selectedMap}
          onItemClick={onItemClick}
        />
      </Stack>
    </Page>
  )
})
