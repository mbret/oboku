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
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { errorToHelperText } from "../common/forms/errorToHelperText"

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

type Inputs = {
  name: string
}

const FORM_ID = "new-tag-dialog"

const AddTagDialog: FC<{
  open: boolean
  onConfirm: (name: string) => void
  onClose: () => void
}> = ({ onClose, onConfirm, open }) => {
  const { control, handleSubmit, setFocus, reset, setError } = useForm<Inputs>({
    defaultValues: {
      name: ""
    }
  })

  const onInnerClose = () => {
    onClose()
  }

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    onInnerClose()
    onConfirm(data.name)
  }

  useEffect(() => {
    reset()
  }, [open, reset])

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setFocus("name")
      })
    }
  }, [setFocus, open])

  return (
    <Dialog onClose={onInnerClose} open={open}>
      <DialogTitle>Create a new tag</DialogTitle>
      <DialogContent>
        <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="name"
            control={control}
            rules={{ required: true }}
            render={({ field: { ref, ...rest }, fieldState }) => {
              return (
                <TextField
                  {...rest}
                  label="Name"
                  type="text"
                  fullWidth
                  margin="normal"
                  inputRef={ref}
                  error={fieldState.invalid}
                  helperText={errorToHelperText(fieldState.error)}
                />
              )
            }}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onInnerClose}>Cancel</Button>
        <Button type="submit" form={FORM_ID}>
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
