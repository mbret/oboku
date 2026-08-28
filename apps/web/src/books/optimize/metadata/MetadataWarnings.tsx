import { Alert, Stack } from "@mui/material"
import { memo } from "react"
import { useBookOptimize } from "../BookOptimizeProvider"
import { CONTAINER_LABELS } from "./identifiers/containers"

export const MetadataWarnings = memo(function MetadataWarnings() {
  const { inspection } = useBookOptimize()
  const { unreadableSources } = inspection.resolvedArchive

  if (unreadableSources.length === 0) return null

  return (
    <Stack spacing={1}>
      {unreadableSources.includes("opf") && (
        <Alert severity="warning" variant="standard">
          This book&apos;s {CONTAINER_LABELS.opf} could not be read, so none of
          its own metadata could be recovered and nothing can be saved back to
          it. Editing it anyway would mean replacing it, which would cost the
          book everything the document holds beyond what oboku understands.
        </Alert>
      )}
      {unreadableSources.includes("comicInfo") && (
        <Alert severity="warning" variant="standard">
          This book&apos;s {CONTAINER_LABELS.comicInfo} could not be read, so
          nothing can be saved back to it. Replacing it would lose whatever else
          it contained.
        </Alert>
      )}
    </Stack>
  )
})
