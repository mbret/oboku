import { TopBarNavigation } from "../../../navigation/TopBarNavigation"
import { Box, Stack, Tab, Tabs, styled } from "@mui/material"
import { useNavigate, useParams } from "react-router"
import { BookListWithControls } from "../../../books/lists"
import { signal, useSignalValue } from "reactjrx"
import type {
  ListActionSorting,
  ListActionViewMode,
} from "../../../common/lists/ListActionsToolbar"
import { useCollectionActionsDrawer } from "../../../collections/CollectionActionsDrawer/useCollectionActionsDrawer"
import { useCollection } from "../../../collections/useCollection"
import { useCallback, useEffect, useState } from "react"
import { useBooks } from "../../../books/states"
import { sortBooksBy } from "../../../books/helpers"
import type { BookQueryResult } from "../../../books/states"
import { Logger } from "../../../debug/logger.shared"
import { useCollectionComputedMetadata } from "../../../collections/useCollectionComputedMetadata"
import { configuration } from "../../../config/configuration"
import { Header } from "./Header"
import { EmptyList } from "../../../common/lists/EmptyList"
import EmptyLibraryAsset from "../../../assets/empty-library.svg"
import { MetadataFetchPolicyPane } from "../../../metadata/MetadataFetchPolicyPane"
import { useResolvedMetadataFetchEnabled } from "../../../metadata/useResolvedMetadataFetchEnabled"
import { useCollectionIncrementalModify } from "../../../collections/useCollectionIncrementalModify"

type ScreenParams = {
  id: string
}

type CollectionDetailsTab = "books" | "details"

/**
 * The whole screen is a single scroller. Top bar + Header + Tabs + tab
 * content all share this scroll context; the books list virtualizes against
 * it via `customScrollParent`.
 */
const ScrollContainer = styled(Stack)({
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
})

/**
 * Local positioning frame for the absolute top bar. Sits inside the
 * scroller so the bar is part of the scroll content (scrolls with the page)
 * while still overlaying the cover hero. `Header`'s built-in `headerPt`
 * already reserves room below the bar — no extra offset needed.
 */
const ScrollFrameBox = styled(Box)({
  position: "relative",
})

const AbsoluteTopBarNavigation = styled(TopBarNavigation)({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1,
})

const bookListStyle = { width: "100%" }

const EMPTY_BOOK_IDS: string[] = []

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
  const { id } = useParams<ScreenParams>()
  const { viewMode, sorting } = useSignalValue(
    collectionDetailsScreenListControlsStateSignal,
  )
  const { data: collection } = useCollection({
    id,
  })
  const selectSortedIds = useCallback(
    (books: BookQueryResult[]) =>
      sortBooksBy(books, sorting).map(({ _id }) => _id),
    [sorting],
  )
  const { data: visibleBookIds = EMPTY_BOOK_IDS } = useBooks({
    ids: collection?.books ?? [],
    select: selectSortedIds,
  })

  const metadata = useCollectionComputedMetadata(collection)
  const { open: openActionDrawer } = useCollectionActionsDrawer(
    id,
    (changes) => {
      if (changes === `delete`) {
        navigate(-1)
      }
    },
  )
  const [tab, setTab] = useState<CollectionDetailsTab>("books")
  const [scrollerEl, setScrollerEl] = useState<HTMLDivElement | null>(null)
  const isEmptyCollection = id === configuration.COLLECTION_EMPTY_ID

  const {
    override: metadataFetchOverride,
    isProtected: metadataFetchIsProtected,
    resolved: metadataFetchResolved,
  } = useResolvedMetadataFetchEnabled({ kind: "collection", collection })
  const { mutate: updateCollection } = useCollectionIncrementalModify()

  useEffect(() => {
    Logger.log({
      collection,
      metadata,
    })
  }, [collection, metadata])

  return (
    <ScrollContainer ref={setScrollerEl}>
      <ScrollFrameBox>
        <AbsoluteTopBarNavigation
          showBack
          color="transparent"
          elevation={0}
          {...(!isEmptyCollection && {
            onMoreClick: openActionDrawer,
          })}
        />
        <Header id={id} />
        {!isEmptyCollection && (
          <Tabs
            value={tab}
            onChange={(_e, value: CollectionDetailsTab) => setTab(value)}
            indicatorColor="primary"
          >
            <Tab label="Books" value="books" />
            <Tab label="Details" value="details" />
          </Tabs>
        )}
        {tab === "books" && (
          <BookListWithControls
            data={visibleBookIds}
            sorting={sorting}
            viewMode={viewMode}
            customScrollParent={scrollerEl ?? undefined}
            style={bookListStyle}
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
            renderEmptyList={
              <EmptyList
                image={{ src: EmptyLibraryAsset, alt: "Empty library" }}
                description="It looks like your library is empty for the moment. Maybe it's time to add a new book"
              />
            }
          />
        )}
        {tab === "details" && !isEmptyCollection && (
          <MetadataFetchPolicyPane
            override={metadataFetchOverride}
            isProtected={metadataFetchIsProtected}
            resolved={metadataFetchResolved}
            onChange={(next) => {
              if (!collection) return
              updateCollection({
                _id: collection._id,
                metadataFetchEnabled: next,
              })
            }}
          />
        )}
      </ScrollFrameBox>
    </ScrollContainer>
  )
}
