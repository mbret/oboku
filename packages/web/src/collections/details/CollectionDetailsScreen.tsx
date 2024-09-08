import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { Box, Stack, Typography, useTheme } from "@mui/material"
import { useNavigate, useParams } from "react-router-dom"
import EmptyLibraryAsset from "../../assets/empty-library.svg"
import CollectionBgSvg from "../../assets/series-bg.svg"
import { BookListWithControls } from "../../books/bookList/BookListWithControls"
import { signal, useSignalValue } from "reactjrx"
import {
  ListActionSorting,
  ListActionViewMode
} from "../../common/lists/ListActionsToolbar"
import { useCollectionActionsDrawer } from "../CollectionActionsDrawer/useCollectionActionsDrawer"
import { useCollection } from "../useCollection"
import { COLLECTION_EMPTY_ID } from "../../constants.shared"
import { useEffect, useMemo } from "react"
import { useBooks } from "../../books/states"
import { useLocalSettings } from "../../settings/states"
import { Report } from "../../debug/report.shared"
import { useCollectionComputedMetadata } from "../useCollectionComputedMetadata"
import { useCollectionCoverUri } from "../useCollectionCoverUri"
import placeholder from "../../assets/cover-placeholder.png"
import { StatusChip } from "../series/StatusChip"
import { useWindowScroll } from "react-use"

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
    sorting: "alpha"
  }
})

export const CollectionDetailsScreen = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { id = `-1` } = useParams<ScreenParams>()
  const { viewMode, sorting } = useSignalValue(
    collectionDetailsScreenListControlsStateSignal
  )
  const { data: collection } = useCollection({
    id
  })
  const { useOptimizedTheme } = useLocalSettings()

  const { data: visibleBooks } = useBooks({
    ids: collection?.books ?? []
  })

  const metadata = useCollectionComputedMetadata(collection)
  const visibleBookIds = useMemo(
    () => visibleBooks?.map((item) => item._id) ?? [],
    [visibleBooks]
  )
  const { uri: coverUri, hasCover } = useCollectionCoverUri(collection)
  const headerPt = [
    `calc(${theme.spacing(1)} + ${50}px)`,
    `calc(${theme.spacing(1)} + ${60}px)`,
    `calc(${theme.spacing(1)} + ${70}px)`
  ]
  const headerHeight = [
    `calc(${headerPt[0]} + 100px)`,
    `calc(${headerPt[1]} + 150px)`,
    `calc(${headerPt[2]} + 250px)`
  ]
  const coverHeight = [
    `calc(${headerHeight[0]} - ${headerPt[0]})`,
    `calc(${headerHeight[1]} - ${headerPt[1]})`,
    `calc(${headerHeight[2]} - ${headerPt[2]})`
  ]
  const coverWidth = [
    `calc(${coverHeight[0]} / 1.5)`,
    `calc(${coverHeight[1]} / 1.5)`,
    `calc(${coverHeight[2]} / 1.5)`
  ]

  const { open: openActionDrawer } = useCollectionActionsDrawer(
    id,
    (changes) => {
      if (changes === `delete`) {
        navigate(-1)
      }
    }
  )
  const { x, y } = useWindowScroll()

  useEffect(() => {
    Report.log({
      collection,
      metadata
    })
  }, [collection, metadata])

  return (
    <>
      <Stack
        flex={1}
        sx={{
          scrollbarWidth: "initial"
        }}
      >
        <TopBarNavigation
          title={metadata.title}
          showBack={true}
          {...(id !== COLLECTION_EMPTY_ID && {
            onMoreClick: openActionDrawer
          })}
          color="transparent"
          sx={{
            bgcolor: `rgba(255, 255, 255, ${Math.min(1, y / 70)})`,
            borderBottom: `1px solid rgba(0, 0, 0, ${Math.min(1, y / 400)})`
          }}
          TitleProps={{
            sx: {
              opacity: Math.min(1, y / 100)
            }
          }}
          position="fixed"
        />
        <Stack
          flex={1}
          sx={{
            scrollbarWidth: "initial"
          }}
        >
          <Stack
            position="relative"
            pt={headerPt}
            minHeight={headerHeight}
            px={2}
            style={{
              backgroundImage: useOptimizedTheme
                ? undefined
                : `url(${hasCover ? (coverUri ?? placeholder) : CollectionBgSvg})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          >
            {!useOptimizedTheme && (
              <Box
                position="absolute"
                left={0}
                top={0}
                height="100%"
                width="100%"
                sx={{
                  background:
                    "linear-gradient(to bottom,rgb(255 255 255 / 0.7) 10%, rgb(255 255 255 / 1) 100%)"
                }}
              />
            )}
            <Stack direction="row" gap={2} justifyContent="flex-start">
              {!!hasCover && (
                <Box
                  position="relative"
                  component="img"
                  src={coverUri ?? placeholder}
                  width={coverWidth}
                  height={coverHeight}
                  borderRadius={1}
                  sx={{
                    objectFit: "cover",
                    objectPosition: "center center"
                  }}
                />
              )}
              <Stack
                pt={hasCover ? 0.5 : 0}
                position="relative"
                alignItems="flex-start"
              >
                <Typography
                  component="h1"
                  sx={{
                    typography: ["h6", "h4"]
                  }}
                  fontWeight="bold"
                >
                  {metadata.displayTitle}
                </Typography>
                <Typography
                  sx={{
                    typography: ["body2", "body1"]
                  }}
                  gutterBottom
                >
                  {`${collection?.books?.length || 0} book(s)`}
                </Typography>
                {collection?.type === "series" && (
                  <StatusChip
                    rating={metadata.rating}
                    status={metadata.status}
                    sx={{
                      bgcolor: "transparent"
                    }}
                  />
                )}
              </Stack>
            </Stack>
          </Stack>
          <BookListWithControls
            data={visibleBookIds}
            useWindowScroll
            sorting={sorting}
            viewMode={viewMode}
            onViewModeChange={(value) => {
              collectionDetailsScreenListControlsStateSignal.setValue(
                (state) => ({
                  ...state,
                  viewMode: value
                })
              )
            }}
            onSortingChange={(value) => {
              collectionDetailsScreenListControlsStateSignal.setValue(
                (state) => ({
                  ...state,
                  sorting: value
                })
              )
            }}
            renderEmptyList={
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flex: 1,
                    justifyContent: "center",
                    flexFlow: "column",
                    alignItems: "center",
                    textAlign: "center",
                    width: "80%",
                    maxWidth: theme.custom.maxWidthCenteredContent
                  }}
                >
                  <img
                    style={{
                      width: "100%"
                    }}
                    src={EmptyLibraryAsset}
                    alt="libray"
                  />
                  <Typography
                    style={{ maxWidth: 300, paddingTop: theme.spacing(1) }}
                  >
                    It looks like your library is empty for the moment. Maybe
                    it's time to add a new book
                  </Typography>
                </div>
              </div>
            }
          />
        </Stack>
      </Stack>
    </>
  )
}
