import { Stack } from "@mui/material"
import { normalizeIsbn } from "@prose-reader/archive-reader"
import { ControlledTextField } from "../../../common/forms/ControlledTextField"
import type { BookOptimizeFormValues } from "../form"
import { useBookOptimize } from "../BookOptimizeProvider"
import type { FileInspection } from "../useFileInspection"

const validateIsbn = (raw: string | boolean): true | string => {
  if (typeof raw !== "string") return true

  const trimmed = raw.trim()

  if (trimmed === "") return true

  return normalizeIsbn(trimmed) !== undefined
    ? true
    : "Not a recognizable ISBN-10 or ISBN-13"
}

const isbnHelperText = ({
  comicInfo,
  opf,
  isbn,
}: FileInspection): string | undefined => {
  if (comicInfo === "absent" && opf === "absent")
    return "This book carries no metadata container — saving an ISBN will add a ComicInfo.xml."

  if (!isbn) return "No ISBN found in this book yet."

  return undefined
}

export function MetadataForm() {
  const { control, inspection, isApplyingLocally, isUploading } =
    useBookOptimize()
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
        helperText={isbnHelperText(inspection)}
        disabled={isApplying}
      />
    </Stack>
  )
}
