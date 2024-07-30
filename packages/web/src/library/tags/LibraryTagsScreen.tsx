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
import { useCreateTag } from "../../tags/helpers"
import { TagActionsDrawer } from "../../tags/TagActionsDrawer"
import { useCSS } from "../../common/utils"
import { TagList } from "../../tags/tagList/TagList"
import { useTagIds } from "../../tags/helpers"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { errorToHelperText } from "../../common/forms/errorToHelperText"
import { authorizeAction } from "../../auth/AuthorizeActionDialog"

export const LibraryTagsScreen = () => {
  const classes = useStyles()
  const [isAddTagDialogOpened, setIsAddTagDialogOpened] = useState(false)
  const [isTagActionsDrawerOpenedWith, setIsTagActionsDrawerOpenedWith] =
    useState<string | undefined>(undefined)
  const { data: tags = [] } = useTagIds()
  const { mutate: addTag } = useCreateTag()
  const theme = useTheme()

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

  const listHeader = useMemo(
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

  const listRenderHeader = useCallback(() => listHeader, [listHeader])

  return (
    <div style={classes.container}>
      <TagList
        style={{
          height: "100%"
        }}
        data={tags}
        renderHeader={listRenderHeader}
        onItemClick={(tag) => {
          const action = () => setIsTagActionsDrawerOpenedWith(tag?._id)
          if (tag?.isProtected) {
            authorizeAction(action)
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
  const { control, handleSubmit, setFocus, reset } = useForm<Inputs>({
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
