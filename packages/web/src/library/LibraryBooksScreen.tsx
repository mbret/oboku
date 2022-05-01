import { useState, useMemo, useEffect } from "react"
import { BookList } from "../books/bookList/BookList"
import {
  Button,
  Toolbar,
  IconButton,
  Badge,
  Typography,
  useTheme,
  makeStyles
} from "@material-ui/core"
import {
  AppsRounded,
  TuneRounded,
  ListRounded,
  SortRounded,
  NoEncryptionRounded,
  BlurOffRounded
} from "@material-ui/icons"
import { LibraryFiltersDrawer } from "./LibraryFiltersDrawer"
import { UploadBookFromDataSource } from "../upload/UploadBookFromDataSource"
import EmptyLibraryAsset from "../assets/empty-library.svg"
import { useCSS, useMeasureElement } from "../common/utils"
import { LibraryViewMode } from "../rxdb"
import { isUploadBookDrawerOpenedState, libraryState } from "./states"
import { booksAsArrayState } from "../books/states"
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil"
import { UploadBookDrawer } from "./UploadBookDrawer"
import { useBooksSortedBy } from "../books/helpers"
import { SortByDialog } from "../books/bookList/SortByDialog"
import { isUploadBookFromDeviceOpenedFromState } from "../upload/state"
import { DownloadState } from "../download/states"
import { localSettingsState } from "../settings/states"
import { useCallback } from "react"
import { useRef } from "react"
import { useTranslation } from "react-i18next"

export const LibraryBooksScreen = () => {
  const styles = useStyles()
  const classes = useClasses()
  const theme = useTheme()
  const [isFiltersDrawerOpened, setIsFiltersDrawerOpened] = useState(false)
  const [isUploadBookDrawerOpened, setIsUploadBookDrawerOpened] =
    useRecoilState(isUploadBookDrawerOpenedState)
  const [isSortingDialogOpened, setIsSortingDialogOpened] = useState(false)
  const setIsUploadBookFromDeviceOpened = useSetRecoilState(
    isUploadBookFromDeviceOpenedFromState
  )
  const localSettings = useRecoilValue(localSettingsState)
  const [
    isUploadBookFromDataSourceDialogOpened,
    setIsUploadBookFromDataSourceDialogOpened
  ] = useState<string | undefined>(undefined)
  const setLibraryState = useSetRecoilState(libraryState)
  const library = useRecoilValue(libraryState)
  let numberOfFiltersApplied = 0
  if ((library?.tags.length || 0) > 0) numberOfFiltersApplied++
  if ((library?.readingStates.length || 0) > 0) numberOfFiltersApplied++
  if (library?.downloadState !== undefined) numberOfFiltersApplied++
  const books = useBooks()
  const { t } = useTranslation()

  const addBookButton = useMemo(
    () => (
      <Button
        style={{
          flex: 1
        }}
        variant="outlined"
        color="primary"
        onClick={() => setIsUploadBookDrawerOpened(true)}
      >
        {t(`library.button.book.add.title`)}
      </Button>
    ),
    [setIsUploadBookDrawerOpened, t]
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

  useEffect(
    () => () => setIsUploadBookDrawerOpened(false),
    [setIsUploadBookDrawerOpened]
  )

  return (
    <div style={styles.container}>
      {listHeaderDimTracker}
      <Toolbar
        style={{
          borderBottom: `1px solid ${theme.palette.grey[200]}`,
          boxSizing: "border-box"
        }}
      >
        <IconButton edge="start" onClick={() => setIsFiltersDrawerOpened(true)}>
          {numberOfFiltersApplied > 0 ? (
            <Badge badgeContent={numberOfFiltersApplied} color="primary">
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
            color="secondary"
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
        {library?.isLibraryUnlocked && (
          <div className={classes.extraInfo}>
            {localSettings.unBlurWhenProtectedVisible && (
              <IconButton disabled>
                <BlurOffRounded fontSize="small" />
              </IconButton>
            )}
            <IconButton
              onClick={() => {
                setLibraryState((prev) => ({
                  ...prev,
                  isLibraryUnlocked: false
                }))
              }}
            >
              <NoEncryptionRounded fontSize="small" />
            </IconButton>
          </div>
        )}
        <IconButton
          onClick={() => {
            setLibraryState((prev) => ({
              ...prev,
              viewMode:
                library?.viewMode === LibraryViewMode.GRID
                  ? LibraryViewMode.LIST
                  : LibraryViewMode.GRID
            }))
          }}
        >
          {library?.viewMode === "grid" ? <AppsRounded /> : <ListRounded />}
        </IconButton>
      </Toolbar>
      <div
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
            viewMode={library?.viewMode}
            sorting={library.sorting}
            headerHeight={listHeaderHeight}
            data={books}
            style={styles.bookList}
            renderHeader={bookListRenderHeader}
          />
        )}
        {isUploadBookFromDataSourceDialogOpened && (
          <UploadBookFromDataSource
            openWith={isUploadBookFromDataSourceDialogOpened}
            onClose={() => setIsUploadBookFromDataSourceDialogOpened(undefined)}
          />
        )}
        <SortByDialog
          value={library.sorting}
          onClose={() => setIsSortingDialogOpened(false)}
          open={isSortingDialogOpened}
          onChange={(newSort) => {
            setLibraryState((prev) => ({ ...prev, sorting: newSort }))
          }}
        />
        <LibraryFiltersDrawer
          open={isFiltersDrawerOpened}
          onClose={() => setIsFiltersDrawerOpened(false)}
        />
        <UploadBookDrawer
          open={isUploadBookDrawerOpened}
          onClose={(type) => {
            setIsUploadBookDrawerOpened(false)
            switch (type) {
              case "device":
                setIsUploadBookFromDeviceOpened("local")
                break
              default:
                setIsUploadBookFromDataSourceDialogOpened(type)
            }
          }}
        />
      </div>
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

const useClasses = makeStyles((theme) => ({
  extraInfo: {
    display: "flex",
    flexFlow: "row",
    alignItems: "center",
    marginLeft: theme.spacing(1),
    overflow: "hidden",
    "@media (max-width:370px)": {
      display: "none"
    }
  }
}))

const useBooks = () => {
  const results = useRef<string[]>([])
  const library = useRecoilValue(libraryState)
  const filteredTags = library.tags
  const unsortedBooks = useRecoilValue(booksAsArrayState)
  const filteredBooks = unsortedBooks.filter((book) => {
    if (
      library.downloadState === DownloadState.Downloaded &&
      book.downloadState.downloadState !== DownloadState.Downloaded
    ) {
      return false
    }
    if (
      filteredTags.length > 0 &&
      !book?.tags?.some((b) => filteredTags.includes(b))
    ) {
      return false
    }
    if (
      library.readingStates.length > 0 &&
      !library.readingStates.includes(book.readingStateCurrentState)
    ) {
      return false
    }
    return true
  })
  const sortedList = useBooksSortedBy(filteredBooks, library.sorting)
  const bookIds = sortedList.map((item) => item._id)

  if (bookIds.length !== results.current.length) {
    results.current = bookIds
  } else {
    for (let i = 0; i < bookIds.length; i++) {
      if (bookIds[i] !== results.current[i]) {
        results.current = bookIds
        break
      }
    }
  }

  return results.current
}
