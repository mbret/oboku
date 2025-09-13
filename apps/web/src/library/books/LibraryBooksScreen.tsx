import { useState, useMemo, useEffect, memo } from "react"
import { BookList } from "../../books/bookList/BookList"
import {
  Button,
  Typography,
  useTheme,
  Stack,
  Toolbar as MuiToolbar,
  Box,
} from "@mui/material"
import { LibraryFiltersDrawer } from "../LibraryFiltersDrawer"
import EmptyLibraryAsset from "../../assets/empty-library.svg"
import {
  libraryStateSignal,
  isUploadBookDrawerOpenedStateSignal,
} from "./states"
import { UploadBookDrawer } from "../UploadBookDrawer"
import { SortByDialog } from "../../books/bookList/SortByDialog"
import { useCallback } from "react"
import { useLibraryBooks } from "./useLibraryBooks"
import { useSignalValue } from "reactjrx"
import { Toolbar } from "./Toolbar"
import { useResetFilters } from "./filters/useResetFilters"
import { uploadBookDialogOpenedSignal } from "../../upload/UploadBookDialog"

export const LibraryBooksScreen = memo(() => {
  const theme = useTheme()
  const [isFiltersDrawerOpened, setIsFiltersDrawerOpened] = useState(false)
  const isUploadBookDrawerOpened = useSignalValue(
    isUploadBookDrawerOpenedStateSignal,
  )
  const [isSortingDialogOpened, setIsSortingDialogOpened] = useState(false)
  const library = useSignalValue(libraryStateSignal)
  const resetFilters = useResetFilters()
  let numberOfFiltersApplied = 0

  if ((library.tags.length || 0) > 0) numberOfFiltersApplied++
  if ((library.readingStates.length || 0) > 0) numberOfFiltersApplied++
  if (library.downloadState !== undefined) numberOfFiltersApplied++
  if (library.isNotInterested === "only") numberOfFiltersApplied++

  const books = useLibraryBooks()

  const addBookButton = useMemo(
    () => (
      <Button
        fullWidth
        variant="outlined"
        onClick={() => {
          isUploadBookDrawerOpenedStateSignal.setValue(true)
        }}
      >
        Add a new book
      </Button>
    ),
    [],
  )

  const listHeader = useMemo(
    () => (
      <Box p={2} pt={1}>
        {addBookButton}
      </Box>
    ),
    [addBookButton],
  )

  const bookListRenderHeader = useCallback(() => listHeader, [listHeader])

  useEffect(() => () => isUploadBookDrawerOpenedStateSignal.setValue(false), [])

  return (
    <Stack
      style={{
        flex: 1,
        overflow: "hidden",
      }}
    >
      <Toolbar
        onFilterClick={() => setIsFiltersDrawerOpened(true)}
        onSortClick={() => setIsSortingDialogOpened(true)}
        onClearFilterClick={() => {
          resetFilters()
        }}
        numberOfFiltersApplied={numberOfFiltersApplied}
      />
      <Stack flex={1}>
        {books.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            {listHeader}
            <Stack
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                alignSelf: "center",
                width: "80%",
                maxWidth: theme.custom.maxWidthCenteredContent,
              }}
            >
              <img
                style={{
                  width: "100%",
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
            </Stack>
          </div>
        )}
        {books.length > 0 && (
          <BookList
            viewMode={library.viewMode}
            sorting={library.sorting}
            data={books}
            style={{
              height: "100%",
            }}
            renderHeader={bookListRenderHeader}
            restoreScrollId="libraryBookListRestoreScrollId"
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
            uploadBookDialogOpenedSignal.setValue(type)
          }}
        />
      </Stack>
    </Stack>
  )
})
