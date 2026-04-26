import { useEffect } from "react"
import Dialog from "@mui/material/Dialog"
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"
import { signal, useSignalValue } from "reactjrx"
import { useCreateTag } from "./helpers"
import { errorToHelperText } from "../common/forms/errorToHelperText"
import { CancelButton } from "../common/forms/CancelButton"

type Inputs = {
  name: string
}

const FORM_ID = "new-tag-dialog"

const addTagDialogSignal = signal<{ open: boolean }>({
  key: "addTagDialogState",
  default: { open: false },
})

export const openAddTagDialog = () => {
  addTagDialogSignal.setValue({ open: true })
}

const closeAddTagDialog = () => {
  addTagDialogSignal.setValue({ open: false })
}

export function AddTagDialog() {
  const { open } = useSignalValue(addTagDialogSignal)
  const { mutate: addTag } = useCreateTag()
  const { control, handleSubmit, setFocus, reset } = useForm<Inputs>({
    defaultValues: {
      name: "",
    },
  })

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    closeAddTagDialog()
    if (data.name) {
      addTag({ name: data.name })
    }
  }

  useEffect(() => {
    void open

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
    <Dialog onClose={closeAddTagDialog} open={open}>
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
        <CancelButton onClick={closeAddTagDialog} />
        <Button type="submit" form={FORM_ID}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}
