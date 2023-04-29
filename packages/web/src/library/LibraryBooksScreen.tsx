import { useState, useMemo, useEffect } from "react"
import { BookList } from "../books/bookList/BookList"
import {
  Button,
  Toolbar,
  IconButton,
  Badge,
  Typography,
  useTheme
} from "@mui/material"
import makeStyles from "@mui/styles/makeStyles"
import {
  AppsRounded,
  TuneRounded,
  ListRounded,
  SortRounded,
  NoEncryptionRounded,
  BlurOffRounded
} from "@mui/icons-material"
import { LibraryFiltersDrawer } from "./LibraryFiltersDrawer"
import { UploadBookFromDataSource } from "../upload/UploadBookFromDataSource"
import EmptyLibraryAsset from "../assets/empty-library.svg"
import { useCSS, useMeasureElement } from "../common/utils"
import { LibraryViewMode } from "../rxdb"
import {
  setIsUploadBookDrawerOpenedState,
  updateLibraryState,
  useIsUploadBookDrawerOpenedState,
  useLibraryState
} from "./states"
import { UploadBookDrawer } from "./UploadBookDrawer"
import { SortByDialog } from "../books/bookList/SortByDialog"
import { useLocalSettingsState } from "../settings/states"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useBooks } from "./useBooks"
import { setIsUploadBookFromDeviceOpened } from "../upload/state"

export const LibraryBooksScreen = () => {
  const styles = useStyles()
  const classes = useClasses()
  const theme = useTheme()
  const [isFiltersDrawerOpened, setIsFiltersDrawerOpened] = useState(false)
  const isUploadBookDrawerOpened = useIsUploadBookDrawerOpenedState()
  const [isSortingDialogOpened, setIsSortingDialogOpened] = useState(false)
  const localSettings = useLocalSettingsState()
  const [
    isUploadBookFromDataSourceDialogOpened,
    setIsUploadBookFromDataSourceDialogOpened
  ] = useState<string | undefined>(undefined)
  const library = useLibraryState()
  let numberOfFiltersApplied = 0
  if ((library.tags.length || 0) > 0) numberOfFiltersApplied++
  if ((library.readingStates.length || 0) > 0) numberOfFiltersApplied++
  if (library.downloadState !== undefined) numberOfFiltersApplied++
  const books = useBooks()
  const { t } = useTranslation()

  const addBookButton = useMemo(
    () => (
      <Button
        fullWidth
        variant="outlined"
        onClick={() => setIsUploadBookDrawerOpenedState(true)}
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

  useEffect(
    () => () => setIsUploadBookDrawerOpenedState(false),
    []
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
        {library.isLibraryUnlocked && (
          <div className={classes.extraInfo}>
            {localSettings.unBlurWhenProtectedVisible && (
              <BlurOffRounded fontSize="small" />
            )}
            <IconButton
              onClick={() => {
                updateLibraryState((state) => ({
                  ...state,
                  isLibraryUnlocked: false
                }))
              }}
              color="primary"
              size="large"
            >
              <NoEncryptionRounded fontSize="small" />
            </IconButton>
          </div>
        )}
        <IconButton
          onClick={() => {
            updateLibraryState((state) => ({
              ...state,
              viewMode:
                library.viewMode === LibraryViewMode.GRID
                  ? LibraryViewMode.LIST
                  : LibraryViewMode.GRID
            }))
          }}
          size="large"
          color="primary"
        >
          {library.viewMode === "grid" ? <AppsRounded /> : <ListRounded />}
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
            viewMode={library.viewMode}
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
            updateLibraryState((s) => ({ ...s, sorting: newSort }))
          }}
        />
        <LibraryFiltersDrawer
          open={isFiltersDrawerOpened}
          onClose={() => setIsFiltersDrawerOpened(false)}
        />
        <UploadBookDrawer
          open={isUploadBookDrawerOpened}
          onClose={(type) => {
            setIsUploadBookDrawerOpenedState(false)
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
