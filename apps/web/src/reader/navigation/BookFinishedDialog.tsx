import {
  Button,
  Checkbox as MuiCheckbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Stack,
  styled,
} from "@mui/material"
import { type ChangeEvent, useCallback, useState } from "react"
import { CancelButton } from "../../common/forms/CancelButton"

const BookFinishedStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}))

type BookFinishedDialogProps = {
  onCancel: () => void
  onConfirm: (shouldDeleteDownloadFile: boolean) => void
}

type BookFinishedDialogContentProps = {
  deleteDownloadFile: boolean
  onDeleteDownloadFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}

function BookFinishedDialogContent({
  deleteDownloadFile,
  onDeleteDownloadFileChange,
}: BookFinishedDialogContentProps) {
  return (
    <BookFinishedStack>
      <DialogContentText>You reached the end of this book.</DialogContentText>
      <FormControlLabel
        control={
          <MuiCheckbox
            checked={deleteDownloadFile}
            onChange={onDeleteDownloadFileChange}
          />
        }
        label="Delete the downloaded file from this device"
      />
    </BookFinishedStack>
  )
}

export function BookFinishedDialog({
  onCancel,
  onConfirm,
}: BookFinishedDialogProps) {
  const [deleteDownloadFile, setDeleteDownloadFile] = useState(false)

  const handleDeleteDownloadFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setDeleteDownloadFile(event.target.checked)
    },
    [],
  )

  const handleClose = useCallback(
    (_event: unknown, reason?: "backdropClick" | "escapeKeyDown") => {
      if (reason === "escapeKeyDown") return
      if (reason === "backdropClick") return

      onCancel()
    },
    [onCancel],
  )

  return (
    <Dialog open transitionDuration={0} onClose={handleClose}>
      <DialogTitle>Book finished</DialogTitle>
      <DialogContent>
        <BookFinishedDialogContent
          deleteDownloadFile={deleteDownloadFile}
          onDeleteDownloadFileChange={handleDeleteDownloadFileChange}
        />
      </DialogContent>
      <DialogActions>
        <CancelButton onClick={onCancel} />
        <Button
          onClick={() => {
            onConfirm(deleteDownloadFile)
          }}
          autoFocus
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
