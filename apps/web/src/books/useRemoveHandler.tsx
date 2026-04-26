import {
  Alert,
  AlertTitle,
  Checkbox as MuiCheckbox,
  DialogContentText,
  Stack,
  Typography,
} from "@mui/material"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { firstValueFrom } from "rxjs"
import { createDialog } from "../common/dialogs/createDialog"
import {
  type RemoveBookMode,
  type RemoveBooksPayload,
  useRemoveBooks,
} from "./useRemoveBooks"

function getUniqueValues<T>(values: readonly T[]) {
  return Array.from(new Set(values))
}

function RemoveBooksDialogContent({
  bookCount,
  onRemoveFromSourceChange,
}: {
  bookCount: number
  onRemoveFromSourceChange: (value: boolean) => void
}) {
  const [removeFromSource, setRemoveFromSource] = useState(false)
  const countLabel = bookCount === 1 ? "this book" : `${bookCount} books`

  return (
    <Stack
      sx={{
        gap: 2,
      }}
    >
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
              setRemoveFromSource(checked)
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
    </Stack>
  )
}

const confirmRemoveBooks = async ({
  bookIds,
}: {
  bookIds: readonly string[]
}) => {
  let mode: RemoveBookMode = "library-only"

  return firstValueFrom(
    createDialog<RemoveBooksPayload>({
      preset: "CONFIRM",
      title: bookIds.length === 1 ? "Delete a book" : "Delete books",
      confirmTitle: "Delete",
      content: (
        <RemoveBooksDialogContent
          bookCount={bookIds.length}
          onRemoveFromSourceChange={(value) => {
            mode = value ? "library-and-source" : "library-only"
          }}
        />
      ),
      onConfirm: () => ({
        bookIds,
        mode,
      }),
    }).$,
  )
}

export const useRemoveHandler = (options: { onSuccess?: () => void } = {}) => {
  const { mutateAsync: removeBooks } = useRemoveBooks()

  return useMutation({
    meta: {
      suppressGlobalErrorToast: true,
    },
    mutationFn: async ({ bookIds }: { bookIds: readonly string[] }) => {
      const uniqueBookIds = getUniqueValues(bookIds)

      if (uniqueBookIds.length === 0) {
        return
      }

      const payload = await confirmRemoveBooks({ bookIds: uniqueBookIds })

      if (!payload) {
        return
      }

      await removeBooks(payload)
    },
    onSuccess: () => {
      options.onSuccess?.()
    },
  })
}
