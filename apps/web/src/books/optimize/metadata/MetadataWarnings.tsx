import { Alert, Stack } from "@mui/material"
import { memo } from "react"
import { useBookOptimize } from "../BookOptimizeProvider"
import { CONTAINER_LABELS } from "./targets"

export const MetadataWarnings = memo(function MetadataWarnings() {
  const { inspection } = useBookOptimize()
  const { unreadableSources } = inspection.resolvedArchive

  if (unreadableSources.length === 0) return null

  return (
    <Stack spacing={1}>
      {unreadableSources.includes("opf") && (
        <Alert severity="warning" variant="standard">
          This book's {CONTAINER_LABELS.opf} could not be read, so none of its
          own metadata could be recovered. You can still fix the book: saving
          writes your values to {CONTAINER_LABELS.comicInfo}, which oboku reads.
          The unreadable document is left untouched — it also holds the book's
          reading order, which oboku cannot rebuild.
        </Alert>
      )}
      {unreadableSources.includes("comicInfo") && (
        <Alert severity="warning" variant="standard">
          This book's {CONTAINER_LABELS.comicInfo} could not be read. Saving
          replaces it entirely with a new one holding only the fields oboku
          supports — anything else it contained is lost.
        </Alert>
      )}
    </Stack>
  )
})
