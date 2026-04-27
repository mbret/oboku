import { TopBarNavigation } from "../../../navigation/TopBarNavigation"
import { Stack, styled } from "@mui/material"
import { useNavigate, useParams } from "react-router"
import { BookListWithControls } from "../../../books/lists"
import { signal, useSignalValue } from "reactjrx"
import type {
  ListActionSorting,
  ListActionViewMode,
} from "../../../common/lists/ListActionsToolbar"
import { useCollectionActionsDrawer } from "../../../collections/CollectionActionsDrawer/useCollectionActionsDrawer"
import { useCollection } from "../../../collections/useCollection"
import { useEffect, useMemo, useState } from "react"
import { useBooks } from "../../../books/states"
import { selectIds } from "../../../queries/selectors"
import { Logger } from "../../../debug/logger.shared"
import { useCollectionComputedMetadata } from "../../../collections/useCollectionComputedMetadata"
import { useScroll } from "../../../common/useScroll"
import { configuration } from "../../../config/configuration"
import { Header } from "./Header"
import { EmptyList } from "../../../common/lists/EmptyList"
import EmptyLibraryAsset from "../../../assets/empty-library.svg"

type ScreenParams = {
  id: string
}

/**
 * The scroll position is exposed as a single `--y` custom property on the bar.
 * All progress ratios are then derived in CSS via `clamp(...)`, so emotion's
 * generated class never changes while the user scrolls.
 */
const ScrollAwareTopBar = styled(TopBarNavigation)(({ theme }) => ({
  backgroundColor: `color-mix(in srgb, ${theme.palette.background.default} calc(clamp(0, var(--y, 0) / 70, 1) * 100%), transparent)`,
  borderBottom: `1px solid color-mix(in srgb, ${theme.palette.divider} calc(clamp(0, var(--y, 0) / 400, 1) * 100%), transparent)`,
}))

const ListContainer = styled(Stack)({
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
})

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
  const { data: visibleBookIds = EMPTY_BOOK_IDS } = useBooks({
    ids: collection?.books ?? [],
    select: selectIds,
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
  const [scrollerEl, setScrollerEl] = useState<HTMLElement | null>(null)
  const { y } = useScroll(scrollerEl)

  useEffect(() => {
    Logger.log({
      collection,
      metadata,
    })
  }, [collection, metadata])

  const renderHeader = useMemo(() => () => <Header id={id} />, [id])

  return (
    <>
      <ScrollAwareTopBar
        title={metadata.title}
        showBack={true}
        {...(id !== configuration.COLLECTION_EMPTY_ID && {
          onMoreClick: openActionDrawer,
        })}
        color="transparent"
        elevation={0}
        style={{ "--y": y } as React.CSSProperties}
        TitleProps={{
          style: {
            flexGrow: 1,
            opacity: "clamp(0, calc(var(--y, 0) / 100), 1)",
          },
        }}
        position="absolute"
      />
      <ListContainer>
        <BookListWithControls
          data={visibleBookIds}
          sorting={sorting}
          viewMode={viewMode}
          renderHeader={renderHeader}
          scrollerRef={(el) =>
            setScrollerEl(el instanceof HTMLElement ? el : null)
          }
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
      </ListContainer>
    </>
  )
}
