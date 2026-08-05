import { useEffect } from "react"
import Dialog from "@mui/material/Dialog"
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material"
import { type SubmitHandler, useForm } from "react-hook-form"
import { signal, useSignalValue } from "reactjrx"
import { useCreateTag } from "./helpers"
import { ControlledTextField } from "../common/forms/ControlledTextField"
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
          <ControlledTextField
            name="name"
            control={control}
            rules={{ required: true }}
            label="Name"
            type="text"
            fullWidth
            margin="normal"
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
