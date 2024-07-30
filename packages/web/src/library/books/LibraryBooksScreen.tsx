import { useState, useMemo, useEffect } from "react"
import { BookList } from "../../books/bookList/BookList"
import {
  Button,
  Toolbar,
  IconButton,
  Badge,
  Typography,
  useTheme,
  Box
} from "@mui/material"
import { TuneRounded, SortRounded } from "@mui/icons-material"
import { LibraryFiltersDrawer } from "../LibraryFiltersDrawer"
import EmptyLibraryAsset from "../../assets/empty-library.svg"
import { useCSS, useMeasureElement } from "../../common/utils"
import {
  libraryStateSignal,
  isUploadBookDrawerOpenedStateSignal
} from "../states"
import { UploadBookDrawer } from "../UploadBookDrawer"
import { SortByDialog } from "../../books/bookList/SortByDialog"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useLibraryBooks } from "./useLibraryBooks"
import { useSignalValue } from "reactjrx"
import { isUploadBookFromDataSourceDialogOpenedSignal } from "../../upload/state"
import { ViewModeIconButton } from "../../common/lists/ListActionsToolbar"

export const LibraryBooksScreen = () => {
  const styles = useStyles()
  const theme = useTheme()
  const [isFiltersDrawerOpened, setIsFiltersDrawerOpened] = useState(false)
  const isUploadBookDrawerOpened = useSignalValue(
    isUploadBookDrawerOpenedStateSignal
  )
  const [isSortingDialogOpened, setIsSortingDialogOpened] = useState(false)
  const library = useSignalValue(libraryStateSignal)
  let numberOfFiltersApplied = 0

  if ((library.tags.length || 0) > 0) numberOfFiltersApplied++
  if ((library.readingStates.length || 0) > 0) numberOfFiltersApplied++
  if (library.downloadState !== undefined) numberOfFiltersApplied++
  if (library.isNotInterested === "only") numberOfFiltersApplied++

  const books = useLibraryBooks()
  const { t } = useTranslation()

  const addBookButton = useMemo(
    () => (
      <Button
        fullWidth
        variant="outlined"
        onClick={() => {
          isUploadBookDrawerOpenedStateSignal.setValue(true)
        }}
      >
        {t(`library.button.book.add.title`)}
      </Button>
    ),
    [t]
  )

  const listHeader = useMemo(
    () => (
      <Toolbar
        style={{
          paddingLeft: theme.spacing(1),
          paddingRight: theme.spacing(1),
          flex: 1
        }}
      >
        {addBookButton}
      </Toolbar>
    ),
    [theme, addBookButton]
  )

  const bookListRenderHeader = useCallback(() => listHeader, [listHeader])

  const [listHeaderDimTracker, { height: listHeaderHeight }] =
    useMeasureElement(listHeader)

  useEffect(() => () => isUploadBookDrawerOpenedStateSignal.setValue(false), [])

  return (
    <div style={styles.container}>
      {listHeaderDimTracker}
      <Toolbar
        style={{
          borderBottom: `1px solid ${theme.palette.grey[200]}`,
          boxSizing: "border-box"
        }}
      >
        <IconButton
          edge="start"
          onClick={() => setIsFiltersDrawerOpened(true)}
          size="large"
          color="primary"
        >
          {numberOfFiltersApplied > 0 ? (
            <Badge badgeContent={numberOfFiltersApplied}>
              <TuneRounded />
            </Badge>
          ) : (
            <TuneRounded />
          )}
        </IconButton>
        <div
          style={{
            flexGrow: 1,
            justifyContent: "flex-start",
            flexFlow: "row",
            display: "flex",
            alignItems: "center"
          }}
        >
          <Button
            variant="text"
            onClick={() => setIsSortingDialogOpened(true)}
            startIcon={<SortRounded />}
          >
            {library.sorting === "activity"
              ? "Recent activity"
              : library.sorting === "alpha"
                ? "A > Z"
                : "Date added"}
          </Button>
        </div>
        <ViewModeIconButton
          viewMode={library.viewMode}
          onViewModeChange={(value) => {
            libraryStateSignal.setValue((state) => ({
              ...state,
              viewMode: value
            }))
          }}
        />
      </Toolbar>
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          flex: 1,
          overflow: "scroll"
        }}
      >
        {books.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: 1
            }}
          >
            <Toolbar style={{ width: "100%", boxSizing: "border-box" }}>
              {addBookButton}
            </Toolbar>
            <div
              style={{
                display: "flex",
                flex: 1,
                justifyContent: "center",
                flexFlow: "column",
                alignItems: "center",
                textAlign: "center",
                // paddingLeft: theme.spacing(2),
                // paddingRight: theme.spacing(2),
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
                It looks like your library is empty for the moment. Maybe it's
                time to add a new book
              </Typography>
            </div>
          </div>
        )}
        {books.length > 0 && (
          <BookList
            viewMode={library.viewMode}
            sorting={library.sorting}
            headerHeight={listHeaderHeight}
            data={books}
            style={styles.bookList}
            renderHeader={bookListRenderHeader}
          />
        )}
        <SortByDialog
          value={library.sorting}
          onClose={() => setIsSortingDialogOpened(false)}
          open={isSortingDialogOpened}
          onChange={(newSort) => {
            libraryStateSignal.setValue((s) => ({ ...s, sorting: newSort }))
          }}
        />
        <LibraryFiltersDrawer
          open={isFiltersDrawerOpened}
          onClose={() => setIsFiltersDrawerOpened(false)}
        />
        <UploadBookDrawer
          open={isUploadBookDrawerOpened}
          onClose={(type) => {
            isUploadBookDrawerOpenedStateSignal.setValue(false)
            isUploadBookFromDataSourceDialogOpenedSignal.setValue(type)
          }}
        />
      </Box>
    </div>
  )
}

const useStyles = () => {
  return useCSS(
    () => ({
      container: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        flex: 1,
        overflow: "hidden"
      },
      bookList: {
        height: "100%"
      }
    }),
    []
  )
}
