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
  ListItemButton,
} from "@mui/material"
import {
  DeleteRounded,
  ImageRounded,
  StorageRounded,
} from "@mui/icons-material"
import { useStorageUse } from "./useStorageUse"
import { BookList } from "../books/bookList/BookList"
import { bookActionDrawerSignal } from "../books/drawer/BookActionsDrawer"
import { useDownloadedFilesInfo } from "../download/useDownloadedFilesInfo"
import { useRemoveDownloadFile } from "../download/useRemoveDownloadFile"
import { difference } from "@oboku/shared"
import Alert from "@mui/material/Alert"
import { Logger } from "../debug/logger.shared"
import { useEffect } from "react"
import { useRemoveCoversInCache } from "../covers/useRemoveCoversInCache"
import { useDownloadedBooks } from "../download/useDownloadedBooks"
import { useBooks } from "../books/states"
import { useRemoveAllDownloads } from "./useRemoveAllDownloads"

export const ManageStorageScreen = () => {
  const books = useDownloadedBooks()
  const bookIds = useMemo(() => books?.map((book) => book._id) ?? [], [books])
  const { data: visibleBooks } = useBooks()
  const visibleBookIds = useMemo(
    () => visibleBooks?.map((item) => item._id) ?? [],
    [visibleBooks],
  )
  const { quotaUsed, quotaInGb, usedInMb, covers, coversWightInMb } =
    useStorageUse([books])
  const { mutate: removeCoversInCache } = useRemoveCoversInCache()
  const { mutateAsync: removeDownloadFile } = useRemoveDownloadFile()
  const { data: downloadedBooks = [], refetch: refetchDownloadedFilesInfo } =
    useDownloadedFilesInfo()
  const downloadedBookIds = downloadedBooks.map(({ id }) => id)
  const extraDownloadFilesIds = difference(downloadedBookIds, bookIds)
  const theme = useTheme()
  const bookIdsToDisplay = useMemo(
    () => bookIds.filter((id) => visibleBookIds?.includes(id)),
    [bookIds, visibleBookIds],
  )
  const { mutate: removeAllDownloads } = useRemoveAllDownloads({
    onSuccess: () => {
      refetchDownloadedFilesInfo()
    },
  })

  const removeExtraBooks = useCallback(() => {
    Promise.all(
      extraDownloadFilesIds.map((id) => removeDownloadFile({ bookId: id })),
    )
      .then(() => refetchDownloadedFilesInfo())
      .catch(Logger.error)
  }, [refetchDownloadedFilesInfo, extraDownloadFilesIds, removeDownloadFile])

  const onItemClick = useCallback(
    (id: string) =>
      bookActionDrawerSignal.setValue({
        openedWith: id,
        actions: ["removeDownload"],
      }),
    [],
  )

  useEffect(() => {
    void books
    refetchDownloadedFilesInfo()
  }, [books, refetchDownloadedFilesInfo])

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
        <ListItemButton onClick={() => removeCoversInCache()}>
          <ListItemIcon>
            <ImageRounded />
          </ListItemIcon>
          <ListItemText
            primary="Delete all covers cached"
            secondary={`${covers} covers are cached for a total of ${coversWightInMb} MB`}
          />
        </ListItemButton>
        {bookIdsToDisplay.length > 0 && (
          <ListItemButton onClick={() => removeAllDownloads()}>
            <ListItemIcon>
              <DeleteRounded />
            </ListItemIcon>
            <ListItemText
              primary="Delete all downloads"
              secondary="Local books will not be deleted"
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
        viewMode={"list"}
        data={bookIdsToDisplay}
        density="dense"
        withBookActions={false}
        style={{
          height: "100%",
          overflow: "hidden",
        }}
        onItemClick={onItemClick}
      />
    </>
  )
}
