import { useState, useMemo, useEffect } from "react"
import { BookList } from "../../books/bookList/BookList"
import {
  Button,
  Typography,
  useTheme,
  Stack,
  Toolbar as MuiToolbar
} from "@mui/material"
import { LibraryFiltersDrawer } from "../LibraryFiltersDrawer"
import EmptyLibraryAsset from "../../assets/empty-library.svg"
import { useCSS } from "../../common/utils"
import {
  libraryStateSignal,
  isUploadBookDrawerOpenedStateSignal
} from "./states"
import { UploadBookDrawer } from "../UploadBookDrawer"
import { SortByDialog } from "../../books/bookList/SortByDialog"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useLibraryBooks } from "./useLibraryBooks"
import { useSignalValue } from "reactjrx"
import { isUploadBookFromDataSourceDialogOpenedSignal } from "../../upload/state"
import { Toolbar } from "./Toolbar"
import { useResetFilters } from "./filters/useResetFilters"

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
  const resetFilters = useResetFilters()

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
    () => <MuiToolbar>{addBookButton}</MuiToolbar>,
    [addBookButton]
  )

  const bookListRenderHeader = useCallback(() => listHeader, [listHeader])

  useEffect(() => () => isUploadBookDrawerOpenedStateSignal.setValue(false), [])

  return (
    <div style={styles.container}>
      <Toolbar
        onFilterClick={() => setIsFiltersDrawerOpened(true)}
        onSortClick={() => setIsSortingDialogOpened(true)}
        onClearFilterClick={() => {
          resetFilters()
        }}
        numberOfFiltersApplied={numberOfFiltersApplied}
      />
      <Stack
        flex={1}
        style={
          {
            // display: "flex",
            // flexDirection: "column",
            // height: "100%",
            // flex: 1,
            // overflow: "scroll"
          }
        }
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
            <MuiToolbar style={{ width: "100%", boxSizing: "border-box" }}>
              {addBookButton}
            </MuiToolbar>
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
            data={books}
            style={styles.bookList}
            renderHeader={bookListRenderHeader}
            restoreScrollId="libraryBookList"
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
      </Stack>
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
