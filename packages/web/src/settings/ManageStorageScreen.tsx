import { useCallback, useMemo } from "react"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import {
  ListItem,
  List,
  ListItemText,
  LinearProgress,
  ListItemIcon,
  Typography,
  Box,
  useTheme,
  Button,
  Divider,
  ListItemButton
} from "@mui/material"
import { DeleteRounded, StorageRounded } from "@mui/icons-material"
import { useStorageUse } from "./useStorageUse"
import { LibraryViewMode } from "../rxdb"
import { BookList } from "../books/bookList/BookList"
import {
  useDownloadedBookWithUnsafeProtectedIdsState,
  useVisibleBookIdsState
} from "../books/states"
import { bookActionDrawerSignal } from "../books/drawer/BookActionsDrawer"
import { useDownloadedFilesInfo } from "../download/useDownloadedFilesInfo"
import { useRemoveDownloadFile } from "../download/useRemoveDownloadFile"
import { difference } from "lodash"
import Alert from "@mui/material/Alert"
import { Report } from "../debug/report.shared"
import { useEffect } from "react"
import { useMutation, useSignalValue } from "reactjrx"
import { useRemoveAllDownloadedFiles } from "../download/useRemoveAllDownloadedFiles"
import { useProtectedTagIds } from "../tags/helpers"
import { libraryStateSignal } from "../library/states"
import { booksDownloadStateSignal } from "../download/states"

export const ManageStorageScreen = () => {
  const bookIds = useDownloadedBookWithUnsafeProtectedIdsState({
    normalizedBookDownloadsState: useSignalValue(
      booksDownloadStateSignal
    )
  })
  const libraryState = useSignalValue(libraryStateSignal)
  const visibleBookIds = useVisibleBookIdsState({
    libraryState,
    protectedTagIds: useProtectedTagIds().data
  })
  const { quotaUsed, quotaInGb, usedInMb } = useStorageUse([bookIds])
  const removeDownloadFile = useRemoveDownloadFile()
  const deleteAllDownloadedFiles = useRemoveAllDownloadedFiles()
  const { data: downloadedBookIds = [], refetch: refetchDownloadedFilesInfo } =
    useDownloadedFilesInfo()
  const extraDownloadFilesIds = difference(downloadedBookIds, bookIds)
  const theme = useTheme()
  const bookIdsToDisplay = useMemo(
    () => bookIds.filter((id) => visibleBookIds.includes(id)),
    [bookIds, visibleBookIds]
  )
  const { mutate: onDeleteAllDownloadsClick } = useMutation({
    mutationFn: async () => {
      const isConfirmed = confirm(
        "Are you sure you want to delete all downloads at once?"
      )

      if (isConfirmed) {
        await deleteAllDownloadedFiles(bookIds)

        refetchDownloadedFilesInfo()
      }
    }
  })

  const removeExtraBooks = useCallback(() => {
    Promise.all(extraDownloadFilesIds.map((id) => removeDownloadFile(id)))
      .then(() => refetchDownloadedFilesInfo())
      .catch(Report.error)
  }, [refetchDownloadedFilesInfo, extraDownloadFilesIds, removeDownloadFile])

  const onItemClick = useCallback(
    (id: string) =>
      bookActionDrawerSignal.setValue({
        openedWith: id,
        actions: ["removeDownload"]
      }),
    []
  )

  useEffect(() => {
    refetchDownloadedFilesInfo()
  }, [bookIds, refetchDownloadedFilesInfo])

  return (
    <>
      <TopBarNavigation title={"Manage storage"} />
      <List>
        <ListItem>
          <ListItemIcon>
            <StorageRounded />
          </ListItemIcon>
          <ListItemText
            primary="Available storage"
            disableTypography
            secondary={
              <div>
                <Box marginY={1}>
                  <LinearProgress
                    variant="determinate"
                    value={quotaUsed * 100}
                  />
                </Box>
                <Typography
                  gutterBottom
                  variant="body2"
                >{`${usedInMb} MB used of ${quotaInGb} GB (${(
                  quotaUsed * 100
                ).toFixed(2)}%)`}</Typography>
                {/* <Typography variant="body2" color="textSecondary"><b>{bytesToMb(bookSize)} MB used by books</b></Typography> */}
              </div>
            }
          />
        </ListItem>
        {bookIdsToDisplay.length > 0 && (
          <ListItemButton onClick={() => onDeleteAllDownloadsClick()}>
            <ListItemIcon>
              <DeleteRounded />
            </ListItemIcon>
            <ListItemText
              primary="Delete all downloads"
              secondary="It will not delete books only available on this device"
            />
          </ListItemButton>
        )}
      </List>
      {extraDownloadFilesIds.length > 0 && (
        <Alert severity="warning" style={{ marginBottom: theme.spacing(0) }}>
          <div style={{ marginBottom: theme.spacing(1) }}>
            It seems that you have some extra downloaded files not linked to
            your current library.
          </div>
          <Button
            variant="outlined"
            color="secondary"
            onClick={removeExtraBooks}
          >
            Remove to free up space
          </Button>
        </Alert>
      )}
      <Divider />
      <BookList
        viewMode={LibraryViewMode.LIST}
        data={bookIdsToDisplay}
        density="dense"
        withBookActions={false}
        style={{
          height: "100%",
          overflow: "hidden"
        }}
        onItemClick={onItemClick}
      />
    </>
  )
}
