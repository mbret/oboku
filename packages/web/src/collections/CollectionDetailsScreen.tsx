import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { Box, Typography, useTheme } from "@mui/material"
import { useNavigate, useParams } from "react-router-dom"
import EmptyLibraryAsset from "../assets/empty-library.svg"
import CollectionBgSvg from "../assets/series-bg.svg"
import { BookListWithControls } from "../books/bookList/BookListWithControls"
import { signal, useSignalValue } from "reactjrx"
import {
  ListActionSorting,
  ListActionViewMode
} from "../common/lists/ListActionsToolbar"
import { useCollectionActionsDrawer } from "./CollectionActionsDrawer/useCollectionActionsDrawer"
import { useCollection } from "./useCollection"
import { COLLECTION_EMPTY_ID } from "../constants.shared"
import { useEffect, useMemo } from "react"
import { useBooks } from "../books/states"
import { useLocalSettings } from "../settings/states"
import { isDebugEnabled } from "../debug/isDebugEnabled.shared"
import { Report } from "../debug/report.shared"
import { getCollectionComputedMetadata } from "./getCollectionComputedMetadata"
import { useCollectionDisplayTitle } from "./useCollectionDisplayTitle"
import { useCollectionComputedMetadata } from "./useCollectionComputedMetadata"

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

  const { open: openActionDrawer } = useCollectionActionsDrawer(
    id,
    (changes) => {
      if (changes === `delete`) {
        navigate(-1)
      }
    }
  )

  useEffect(() => {
    Report.log({
      collection,
      metadata
    })
  }, [collection, metadata])

  return (
    <>
      <div
        style={{
          flex: 1,
          height: "100%"
        }}
      >
        <TopBarNavigation
          title=""
          showBack={true}
          position="absolute"
          sx={{
            bgcolor: "transparent",
            border: 0
          }}
          {...(id !== COLLECTION_EMPTY_ID && {
            onMoreClick: openActionDrawer
          })}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            flex: 1
          }}
        >
          <Box
            style={{
              paddingTop: `calc(${theme.spacing(1)} + ${50}px)`,
              display: "flex",
              alignItems: "flex-end",
              paddingLeft: theme.spacing(2),
              paddingRight: theme.spacing(2),
              width: "100%",
              backgroundImage: useOptimizedTheme
                ? undefined
                : `url(${CollectionBgSvg})`,
              backgroundAttachment: "fixed",
              backgroundSize: "cover",
              ...(useOptimizedTheme && {
                borderBottom: `1px solid black`
              })
            }}
          >
            <div>
              <Typography
                variant="h5"
                style={{
                  ...(!useOptimizedTheme && {
                    color: "white",
                    textShadow: "0px 0px 3px black"
                  })
                }}
              >
                {metadata.displayTitle}
              </Typography>
              <Typography
                variant="subtitle1"
                gutterBottom
                style={{
                  ...(!useOptimizedTheme && {
                    color: "white",
                    textShadow: "0px 0px 3px black"
                  })
                }}
              >
                {`${collection?.books?.length || 0} book(s)`}
              </Typography>
            </div>
          </Box>
          <BookListWithControls
            data={visibleBookIds}
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
        </div>
      </div>
    </>
  )
}
