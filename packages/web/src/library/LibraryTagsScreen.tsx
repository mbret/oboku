import { useState, FC, useEffect, useCallback, useMemo } from "react"
import Dialog from "@mui/material/Dialog"
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Toolbar,
  useTheme
} from "@mui/material"
import { useCreateTag } from "../tags/helpers"
import { TagActionsDrawer } from "../tags/TagActionsDrawer"
import { LockActionDialog } from "../auth/LockActionDialog"
import { useSetRecoilState } from "recoil"
import { isTagsTourOpenedState } from "../firstTimeExperience/firstTimeExperienceStates"
import { useCSS, useMeasureElement } from "../common/utils"
import { useHasDoneFirstTimeExperience } from "../firstTimeExperience/helpers"
import { FirstTimeExperienceId } from "../firstTimeExperience/constants"
import { TagList } from "../tags/tagList/TagList"
import { AppTourFirstTourTagsStep2 } from "../firstTimeExperience/AppTourFirstTourTags"
import { useDatabase } from "../rxdb"
import { useTagIds } from "../tags/states"

export const LibraryTagsScreen = () => {
  const { db$ } = useDatabase()
  const [lockedAction, setLockedAction] = useState<(() => void) | undefined>(
    undefined
  )
  const classes = useStyles()
  const [isAddTagDialogOpened, setIsAddTagDialogOpened] = useState(false)
  const setIsTagsTourOpenedState = useSetRecoilState(isTagsTourOpenedState)
  const [isTagActionsDrawerOpenedWith, setIsTagActionsDrawerOpenedWith] =
    useState<string | undefined>(undefined)
  const tags = useTagIds(db$)
  const [addTag] = useCreateTag()
  const hasDoneFirstTimeExperience = useHasDoneFirstTimeExperience(
    FirstTimeExperienceId.APP_TOUR_FIRST_TOUR_TAGS
  )
  const theme = useTheme()

  useEffect(() => {
    !hasDoneFirstTimeExperience && setIsTagsTourOpenedState(true)
  }, [setIsTagsTourOpenedState, hasDoneFirstTimeExperience])

  const addItemButton = useMemo(
    () => (
      <Button
        style={{
          flex: 1
        }}
        variant="outlined"
        color="primary"
        onClick={() => setIsAddTagDialogOpened(true)}
      >
        Create a new tag
      </Button>
    ),
    [setIsAddTagDialogOpened]
  )

  const measurableListHeader = useMemo(
    () => (
      <Toolbar
        style={{
          paddingLeft: theme.spacing(2),
          paddingRight: theme.spacing(2),
          flex: 1
        }}
      >
        {addItemButton}
      </Toolbar>
    ),
    [theme, addItemButton]
  )

  const listHeader = useMemo(
    () => (
      <Toolbar
        style={{
          paddingLeft: theme.spacing(2),
          paddingRight: theme.spacing(2),
          flex: 1
        }}
      >
        <AppTourFirstTourTagsStep2>{addItemButton}</AppTourFirstTourTagsStep2>
      </Toolbar>
    ),
    [theme, addItemButton]
  )

  const listRenderHeader = useCallback(() => listHeader, [listHeader])

  const [listHeaderDimTracker, { height: listHeaderHeight }] =
    useMeasureElement(measurableListHeader)

  return (
    <div style={classes.container}>
      {listHeaderDimTracker}
      <TagList
        style={{
          height: "100%"
        }}
        data={tags}
        headerHeight={listHeaderHeight}
        renderHeader={listRenderHeader}
        onItemClick={(tag) => {
          const action = () => setIsTagActionsDrawerOpenedWith(tag?._id)
          if (tag?.isProtected) {
            setLockedAction((_) => action)
          } else {
            action()
          }
        }}
      />
      <AddTagDialog
        onConfirm={(name) => {
          if (name) {
            addTag({ name })
          }
        }}
        onClose={() => setIsAddTagDialogOpened(false)}
        open={isAddTagDialogOpened}
      />
      <LockActionDialog action={lockedAction} />
      <TagActionsDrawer
        openWith={isTagActionsDrawerOpenedWith}
        onClose={() => setIsTagActionsDrawerOpenedWith(undefined)}
      />
    </div>
  )
}

const AddTagDialog: FC<{
  open: boolean
  onConfirm: (name: string) => void
  onClose: () => void
}> = ({ onClose, onConfirm, open }) => {
  const [name, setName] = useState("")
  const onInnerClose = () => {
    setName("")
    onClose()
  }

  return (
    <Dialog onClose={onInnerClose} open={open}>
      <DialogTitle>Create a new tag</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          id="name"
          margin="dense"
          label="Name"
          type="text"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onInnerClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={() => {
            onInnerClose()
            onConfirm(name)
          }}
          color="primary"
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const useStyles = () => {
  return useCSS(
    () => ({
      container: {
        flex: 1,
        overflow: "auto"
      },
      list: {}
    }),
    []
  )
}
