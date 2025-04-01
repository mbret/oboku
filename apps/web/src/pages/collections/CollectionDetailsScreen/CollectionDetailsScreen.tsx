import { TopBarNavigation } from "../../../navigation/TopBarNavigation"
import { Stack } from "@mui/material"
import { useNavigate, useParams } from "react-router"
import { BookListWithControls } from "../../../books/bookList/BookListWithControls"
import { signal, useSignalValue } from "reactjrx"
import type {
  ListActionSorting,
  ListActionViewMode,
} from "../../../common/lists/ListActionsToolbar"
import { useCollectionActionsDrawer } from "../../../collections/CollectionActionsDrawer/useCollectionActionsDrawer"
import { useCollection } from "../../../collections/useCollection"
import { useEffect, useMemo, useState } from "react"
import { useBooks } from "../../../books/states"
import { Logger } from "../../../debug/logger.shared"
import { useCollectionComputedMetadata } from "../../../collections/useCollectionComputedMetadata"
import { useRafState } from "react-use"
import { configuration } from "../../../config/configuration"
import { createPortal } from "react-dom"
import { Header } from "./Header"
import { EmptyList } from "./EmptyList"

type ScreenParams = {
  id: string
}

export const collectionDetailsScreenListControlsStateSignal = signal<{
  viewMode?: ListActionViewMode
  sorting?: ListActionSorting
}>({
  key: "collectionDetailsScreenListControlsStateSignal",
  default: {
    viewMode: "grid",
    sorting: "alpha",
  },
})

export const CollectionDetailsScreen = () => {
  const navigate = useNavigate()
  const { id = `-1` } = useParams<ScreenParams>()
  const { viewMode, sorting } = useSignalValue(
    collectionDetailsScreenListControlsStateSignal,
  )
  const { data: collection } = useCollection({
    id,
  })
  const { data: visibleBooks } = useBooks({
    ids: collection?.books ?? [],
  })

  const metadata = useCollectionComputedMetadata(collection)
  const visibleBookIds = useMemo(
    () => visibleBooks?.map((item) => item._id) ?? [],
    [visibleBooks],
  )
  const { open: openActionDrawer } = useCollectionActionsDrawer(
    id,
    (changes) => {
      if (changes === `delete`) {
        navigate(-1)
      }
    },
  )
  const [scrollerRef, setScrollerRef] = useState<HTMLElement | Window | null>(
    null,
  )
  const [staticContainer, setStaticContainer] = useState<HTMLElement | null>(
    null,
  )
  const [y, setY] = useRafState(0)

  useEffect(() => {
    if (!scrollerRef || !(scrollerRef instanceof HTMLElement)) return

    const handler = () => {
      setY(scrollerRef.scrollTop)
    }

    scrollerRef.addEventListener("scroll", handler)

    return () => {
      scrollerRef.removeEventListener("scroll", handler)
    }
  }, [scrollerRef, setY])

  useEffect(() => {
    if (!scrollerRef || !(scrollerRef instanceof HTMLElement)) return

    const container = scrollerRef.ownerDocument.createElement("div")
    container.style.display = "contents"
    scrollerRef.prepend(container)

    setStaticContainer(container)
  }, [scrollerRef])

  useEffect(() => {
    Logger.log({
      collection,
      metadata,
    })
  }, [collection, metadata])

  const renderHeader = useMemo(() => () => <Header id={id} />, [id])

  const staticContent = (
    <TopBarNavigation
      title={metadata.title}
      showBack={true}
      {...(id !== configuration.COLLECTION_EMPTY_ID && {
        onMoreClick: openActionDrawer,
      })}
      color="transparent"
      sx={{
        bgcolor: `rgba(255, 255, 255, ${Math.min(1, y / 70)})`,
        borderBottom: `1px solid rgba(0, 0, 0, ${Math.min(1, y / 400)})`,
      }}
      TitleProps={{
        sx: {
          opacity: Math.min(1, y / 100),
        },
      }}
      position={visibleBookIds.length === 0 ? "fixed" : "sticky"}
    />
  )

  return (
    <>
      {!!staticContainer && createPortal(staticContent, staticContainer)}
      <Stack flex={1}>
        <Stack flex={1} height="100%" overflow="hidden">
          {visibleBookIds.length === 0 && staticContent}
          <BookListWithControls
            data={visibleBookIds}
            sorting={sorting}
            viewMode={viewMode}
            renderHeader={renderHeader}
            scrollerRef={setScrollerRef}
            onViewModeChange={(value) => {
              collectionDetailsScreenListControlsStateSignal.setValue(
                (state) => ({
                  ...state,
                  viewMode: value,
                }),
              )
            }}
            onSortingChange={(value) => {
              collectionDetailsScreenListControlsStateSignal.setValue(
                (state) => ({
                  ...state,
                  sorting: value,
                }),
              )
            }}
            renderEmptyList={<EmptyList />}
          />
        </Stack>
      </Stack>
    </>
  )
}
