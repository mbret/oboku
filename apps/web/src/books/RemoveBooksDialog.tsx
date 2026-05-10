import {
  Alert,
  AlertTitle,
  Button,
  Checkbox as MuiCheckbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  styled,
  Typography,
} from "@mui/material"
import { useState } from "react"
import type { RemoveBookMode, RemoveBooksPayload } from "./useRemoveBooks"

const RemoveBooksStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}))

function RemoveBooksDialogContent({
  bookCount,
  removeFromSource,
  onRemoveFromSourceChange,
}: {
  bookCount: number
  removeFromSource: boolean
  onRemoveFromSourceChange: (value: boolean) => void
}) {
  const countLabel = bookCount === 1 ? "this book" : `${bookCount} books`

  return (
    <RemoveBooksStack>
      <DialogContentText>
        {`You are about to remove ${countLabel} from your library, are you sure ?`}
      </DialogContentText>
      <Alert
        severity="error"
        variant="outlined"
        action={
          <MuiCheckbox
            checked={removeFromSource}
            color="error"
            onChange={(_, checked) => {
              onRemoveFromSourceChange(checked)
            }}
            slotProps={{
              input: {
                "aria-label":
                  bookCount === 1
                    ? "Also delete the original file from its source"
                    : "Also delete the original files from their sources",
              },
            }}
          />
        }
      >
        <AlertTitle>
          {bookCount === 1
            ? "Permanently delete the original file from its source"
            : "Permanently delete the original files from their sources"}
        </AlertTitle>
        <Typography variant="body2" color="error">
          This only applies to items linked to remote providers and may remove
          the original files permanently.
        </Typography>
      </Alert>
    </RemoveBooksStack>
  )
}

export function RemoveBooksDialog({
  bookIds,
  onCancel,
  onConfirm,
}: {
  bookIds: readonly string[]
  onCancel: () => void
  onConfirm: (payload: RemoveBooksPayload) => void
}) {
  const [removeFromSource, setRemoveFromSource] = useState(false)
  const mode: RemoveBookMode = removeFromSource
    ? "library-and-source"
    : "library-only"

  return (
    <Dialog open transitionDuration={0} onClose={() => onCancel()}>
      <DialogTitle>
        {bookIds.length === 1 ? "Delete a book" : "Delete books"}
      </DialogTitle>
      <DialogContent>
        <RemoveBooksDialogContent
          bookCount={bookIds.length}
          removeFromSource={removeFromSource}
          onRemoveFromSourceChange={setRemoveFromSource}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary">
          Cancel
        </Button>
        <Button
          onClick={() =>
            onConfirm({
              bookIds,
              mode,
            })
          }
          color="primary"
          autoFocus
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
}
