import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react"
import { BookList, SortByDialog } from "../../books/lists"
import { Button, Typography, useTheme, Stack, Box } from "@mui/material"
import { LibraryFiltersDrawer } from "../LibraryFiltersDrawer"
import EmptyLibraryAsset from "../../assets/empty-library.svg"
import {
  libraryStateSignal,
  isUploadBookDrawerOpenedStateSignal,
} from "./states"
import { UploadBookDrawer } from "../UploadBookDrawer"
import { useLibraryBooks } from "./useLibraryBooks"
import { useSignalValue } from "reactjrx"
import { Toolbar } from "./Toolbar"
import { useResetFilters } from "./filters/useResetFilters"
import { uploadBookDialogOpenedSignal } from "../../upload/UploadBookDialog"
import {
  useMarkBooksAsFinished,
  useMarkBooksAsUnread,
} from "../../books/useMarkBookAs"
import { useRemoveHandler } from "../../books/useRemoveHandler"
import { useSelectionState } from "../../common/selection"
import { SelectionToolbar } from "./SelectionToolbar"
import { useLayeredEscape } from "../../common/useLayeredEscape"

const bookListStyle = {
  height: "100%",
} satisfies CSSProperties

export const LibraryBooksScreen = memo(function LibraryBooksScreen() {
  const theme = useTheme()
  const [isFiltersDrawerOpened, setIsFiltersDrawerOpened] = useState(false)
  const isUploadBookDrawerOpened = useSignalValue(
    isUploadBookDrawerOpenedStateSignal,
  )
  const [isSortingDialogOpened, setIsSortingDialogOpened] = useState(false)
  const library = useSignalValue(libraryStateSignal)
  const resetFilters = useResetFilters()
  const books = useLibraryBooks()
  const {
    clearSelection,
    isSelectionMode,
    selectedCount,
    selectedIds: selectedBookIds,
    selectedItems: selectedBooks,
    startSelection,
    toggleSelection,
  } = useSelectionState(books)
  const {
    mutate: markBooksAsFinished,
    isPending: isMarkBooksAsFinishedPending,
  } = useMarkBooksAsFinished({
    onSuccess: clearSelection,
  })
  const { mutate: markBooksAsUnread, isPending: isMarkBooksAsUnreadPending } =
    useMarkBooksAsUnread({
      onSuccess: clearSelection,
    })
  const { mutate: removeBooks, isPending: isRemoveBooksPending } =
    useRemoveHandler({
      onSuccess: clearSelection,
    })

  let numberOfFiltersApplied = 0

  if ((library.tags.length || 0) > 0) numberOfFiltersApplied++
  if ((library.readingStates.length || 0) > 0) numberOfFiltersApplied++
  if (library.downloadState !== undefined) numberOfFiltersApplied++
  if (library.isNotInterested === "only") numberOfFiltersApplied++

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

  const isSelectionActionPending =
    isMarkBooksAsFinishedPending ||
    isMarkBooksAsUnreadPending ||
    isRemoveBooksPending

  useLayeredEscape({
    enabled: isSelectionMode && !isSelectionActionPending,
    layer: "base",
    onEscape: () => {
      clearSelection()
    },
  })

  return (
    <Stack
      style={{
        flex: 1,
        overflow: "hidden",
      }}
    >
      {isSelectionMode ? (
        <SelectionToolbar
          isSelectionActionPending={isSelectionActionPending}
          selectionCount={selectedCount}
          onCancelSelection={clearSelection}
          onDeleteSelection={() => {
            removeBooks({
              bookIds: Array.from(selectedBookIds),
            })
          }}
          onMarkSelectionAsRead={() =>
            markBooksAsFinished({ bookIds: selectedBookIds })
          }
          onMarkSelectionAsUnread={() =>
            markBooksAsUnread({ bookIds: selectedBookIds })
          }
        />
      ) : (
        <Toolbar
          onFilterClick={() => setIsFiltersDrawerOpened(true)}
          onSortClick={() => setIsSortingDialogOpened(true)}
          onClearFilterClick={() => {
            resetFilters()
          }}
          numberOfFiltersApplied={numberOfFiltersApplied}
        />
      )}
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
            style={bookListStyle}
            renderHeader={bookListRenderHeader}
            restoreScrollId="libraryBookListRestoreScrollId"
            selected={selectedBooks}
            selectionMode={isSelectionMode}
            onSelectionStart={startSelection}
            onSelectionToggle={toggleSelection}
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
