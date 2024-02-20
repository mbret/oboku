import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography
} from "@mui/material"
import { ArrowBackIosRounded, LocalOfferRounded } from "@mui/icons-material"
import { FC, useState } from "react"
import { useTagIds, useTags } from "../../tags/helpers"
import { useCreateDataSource } from "../../dataSources/helpers"
import { GoogleDriveDataSourceData } from "@oboku/shared"
import { useDrivePicker } from "./lib/useDrivePicker"
import { TagsSelectionDialog } from "../../tags/TagsSelectionDialog"
import { catchError, EMPTY, takeUntil, tap } from "rxjs"
import { useUnmountObservable } from "reactjrx"

export const GoogleDriveDataSource: FC<{
  onClose: () => void
  requestPopup: () => Promise<boolean>
}> = ({ onClose, requestPopup }) => {
  const [selectedTags, setSelectedTags] = useState<{
    [key: string]: true | undefined
  }>({})
  const [isTagSelectionOpen, setIsTagSelectionOpen] = useState(false)
  const addDataSource = useCreateDataSource()
  const [selectedFolder, setSelectedFolder] = useState<
    { name: string; id: string } | undefined
  >(undefined)
  const [folderChain, setFolderChain] = useState<
    { name: string; id: string }[]
  >([{ name: "", id: "root" }])
  const currentFolder = folderChain[folderChain.length - 1]
  const { data: tags } = useTags()
  const { data: tagIds = [] } = useTagIds()
  const { pick } = useDrivePicker({ requestPopup })
  const unMount$ = useUnmountObservable()

  return (
    <>
      <Dialog onClose={onClose} open fullScreen>
        <DialogTitle>Google Drive datasource</DialogTitle>
        <DialogContent
          style={{ padding: 0, display: "flex", flexFlow: "column" }}
        >
          <List>
            <ListItem onClick={() => setIsTagSelectionOpen(true)}>
              <ListItemIcon>
                <LocalOfferRounded />
              </ListItemIcon>
              <ListItemText
                primary="Apply tags"
                secondary={Object.keys(selectedTags)
                  .map((id) => tags?.find((tag) => tag?._id === id)?.name)
                  .join(" ")}
              />
            </ListItem>
            <ListItem>
              <Typography noWrap>
                Selected: {selectedFolder?.name || "None"}
              </Typography>
            </ListItem>
            {currentFolder?.id !== "root" && (
              <ListItem>
                <Button
                  style={{
                    flex: 1
                  }}
                  startIcon={<ArrowBackIosRounded style={{}} />}
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    setFolderChain((value) => value.slice(0, value.length - 1))
                  }}
                >
                  Go back
                </Button>
              </ListItem>
            )}
          </List>
          <Box
            flex={1}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Button
              color="primary"
              variant="contained"
              onClick={() => {
                pick({ select: "folder" })
                  .pipe(
                    tap((data) => {
                      if (data.action === google.picker.Action.PICKED) {
                        setSelectedFolder(data.docs[0])
                      }
                    }),
                    takeUntil(unMount$.current),
                    catchError((error) => {
                      console.error(error)

                      return EMPTY
                    })
                  )
                  .subscribe()
              }}
            >
              Choose a folder
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Cancel
          </Button>
          <Button
            color="primary"
            disabled={!selectedFolder}
            onClick={() => {
              onClose()
              if (selectedFolder) {
                const customData: GoogleDriveDataSourceData = {
                  applyTags: Object.keys(selectedTags),
                  folderId: selectedFolder.id,
                  folderName: selectedFolder.name
                }
                addDataSource({
                  type: `DRIVE`,
                  data: JSON.stringify(customData)
                })
              }
            }}
          >
            Confirm
          </Button>
        </DialogActions>
        <TagsSelectionDialog
          open={isTagSelectionOpen}
          onClose={() => setIsTagSelectionOpen(false)}
          title="Choose tags to apply automatically"
          data={tagIds}
          hasBackNavigation
          selected={(id) => !!selectedTags[id]}
          onItemClick={({ id }) => {
            if (selectedTags[id]) {
              setSelectedTags(({ [id]: removed, ...rest }) => rest)
            } else {
              setSelectedTags((value) => ({ ...value, [id]: true }))
            }
          }}
        />
      </Dialog>
    </>
  )
}
