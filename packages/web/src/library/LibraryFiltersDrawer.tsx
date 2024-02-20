import { useState, FC } from "react"
import Dialog from "@mui/material/Dialog"
import {
  DialogTitle,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  DialogActions,
  Button,
  ListItemButton
} from "@mui/material"
import {
  ArrowForwardIosRounded,
  CheckCircleRounded,
  RadioButtonUncheckedOutlined
} from "@mui/icons-material"
import { getDisplayableReadingState, useToggleTag } from "./helpers"
import { useTagIds } from "../tags/helpers"
import { ReadingStateState } from "@oboku/shared"
import { DownloadState } from "../download/states"
import { TagsSelectionDialog } from "../tags/TagsSelectionDialog"
import { useSignalValue } from "reactjrx"
import { libraryStateSignal } from "./states"

export const LibraryFiltersDrawer: FC<{
  open: boolean
  onClose: () => void
}> = ({ open, onClose }) => {
  const [isTagsDialogOpened, setIsTagsDialogOpened] = useState(false)
  const [isReadingStateDialogOpened, setIsReadingStateDialogOpened] =
    useState(false)
  const { data: tags = [] } = useTagIds()
  const library = useSignalValue(libraryStateSignal)
  const selectedTags = library.tags
  const toggleTag = useToggleTag()

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        transitionDuration={0}
      >
        <div role="presentation">
          <List>
            <ListItem button onClick={() => setIsTagsDialogOpened(true)}>
              <ListItemText
                primary="Tags"
                secondary={
                  (selectedTags?.length || 0) > 0
                    ? "You have selected tags"
                    : "Any"
                }
              />
              <ListItemIcon>
                <ArrowForwardIosRounded />
              </ListItemIcon>
            </ListItem>
            <ListItem
              button
              onClick={() => setIsReadingStateDialogOpened(true)}
            >
              <ListItemText
                primary="Reading state"
                secondary={
                  library.readingStates.length > 0
                    ? library.readingStates
                        .map((s) => getDisplayableReadingState(s))
                        .join(", ")
                    : "Any"
                }
              />
              <ListItemIcon>
                <ArrowForwardIosRounded />
              </ListItemIcon>
            </ListItem>
            <ListItem
              button
              onClick={() =>
                libraryStateSignal.setValue((state) => ({
                  ...state,
                  downloadState:
                    library.downloadState === DownloadState.Downloaded
                      ? undefined
                      : DownloadState.Downloaded
                }))
              }
            >
              <ListItemText primary="Only show downloaded" />
              <ListItemIcon>
                {library.downloadState !== DownloadState.Downloaded && (
                  <RadioButtonUncheckedOutlined />
                )}
                {library.downloadState === DownloadState.Downloaded && (
                  <CheckCircleRounded />
                )}
              </ListItemIcon>
            </ListItem>
            <ListItemButton
              onClick={() =>
                libraryStateSignal.setValue((state) => ({
                  ...state,
                  isNotInterested:
                    library.isNotInterested === "only" ? "hide" : "only"
                }))
              }
            >
              <ListItemText primary="Only show not interested books" />
              <ListItemIcon>
                {library.isNotInterested !== "only" && (
                  <RadioButtonUncheckedOutlined />
                )}
                {library.isNotInterested === "only" && <CheckCircleRounded />}
              </ListItemIcon>
            </ListItemButton>
          </List>
        </div>
      </Drawer>
      <TagsSelectionDialog
        hasBackNavigation
        open={isTagsDialogOpened}
        onClose={() => setIsTagsDialogOpened(false)}
        data={tags}
        selected={(tagId) => !!library.tags?.find((item) => item === tagId)}
        onItemClick={({ id }) => {
          toggleTag(id)
        }}
      />
      <ReadingStateDialog
        open={isReadingStateDialogOpened}
        onClose={() => setIsReadingStateDialogOpened(false)}
      />
    </>
  )
}

const ReadingStateDialog: FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose
}) => {
  const library = useSignalValue(libraryStateSignal)
  const readingStates = [
    ReadingStateState.NotStarted,
    ReadingStateState.Reading,
    ReadingStateState.Finished
  ]

  return (
    <Dialog onClose={onClose} aria-labelledby="simple-dialog-title" open={open}>
      <DialogTitle>Reading state</DialogTitle>
      {readingStates.map((readingState) => (
        <ListItem
          button
          key={readingState}
          onClick={() => {
            if (library.readingStates.includes(readingState)) {
              libraryStateSignal.setValue((state) => ({
                ...state,
                readingStates: library.readingStates.filter(
                  (s) => s !== readingState
                )
              }))
            } else {
              libraryStateSignal.setValue((state) => ({
                ...state,
                readingStates: [...library.readingStates, readingState]
              }))
            }
          }}
        >
          <ListItemText primary={getDisplayableReadingState(readingState)} />
          {library.readingStates.includes(readingState) ? (
            <CheckCircleRounded />
          ) : (
            <RadioButtonUncheckedOutlined />
          )}
        </ListItem>
      ))}
      <DialogActions>
        <Button onClick={onClose} color="primary" autoFocus>
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  )
}
