import { Stack } from "@mui/material"
import { archiveMetadataIsbn } from "@oboku/archive-metadata/web"
import { normalizeIsbn } from "@prose-reader/archive-reader"
import { ControlledTextField } from "../../../common/forms/ControlledTextField"
import type { BookOptimizeFormValues } from "../form"
import { useBookOptimize } from "../BookOptimizeProvider"
import { useIsApplyingLocally } from "../apply/useApplyLocally"

const validateIsbn = (raw: string | boolean): true | string => {
  if (typeof raw !== "string") return true

  const trimmed = raw.trim()

  if (trimmed === "") return true

  return normalizeIsbn(trimmed) !== undefined
    ? true
    : "Not a recognizable ISBN-10 or ISBN-13"
}

export function MetadataForm() {
  const { bookId, control, inspection, isUploading } = useBookOptimize()
  const isApplyingLocally = useIsApplyingLocally(bookId)
  const isApplying = isApplyingLocally || isUploading

  return (
    <Stack spacing={2}>
      <ControlledTextField<BookOptimizeFormValues>
        name="isbn"
        control={control}
        rules={{ validate: validateIsbn }}
        label="ISBN"
        size="small"
        fullWidth
        helperText={
          archiveMetadataIsbn(inspection.resolvedArchive.metadata)
            ? undefined
            : "No ISBN found in this book yet."
        }
        disabled={isApplying}
      />
    </Stack>
  )
}
