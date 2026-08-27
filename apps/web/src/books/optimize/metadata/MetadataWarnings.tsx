import { Alert, Stack } from "@mui/material"
import { memo } from "react"
import { useBookOptimize } from "../BookOptimizeProvider"
import { CONTAINER_LABELS, resolveMetadataTargets } from "./targets"

export const MetadataWarnings = memo(function MetadataWarnings() {
  const { inspection } = useBookOptimize()
  const { unreadableSources } = inspection.resolvedArchive
  const targets = resolveMetadataTargets(inspection)

  if (unreadableSources.length === 0) return null

  return (
    <Stack spacing={1}>
      {unreadableSources.includes("opf") && (
        <Alert severity="warning" variant="standard">
          This book&apos;s {CONTAINER_LABELS.opf} could not be read, so none of
          its own metadata could be recovered. It is left untouched rather than
          replaced — it also holds the book&apos;s reading order, which oboku
          cannot rebuild.
          {targets.comicInfo
            ? ` Saving writes your values to ${CONTAINER_LABELS.comicInfo}, which the book already carries and oboku reads.`
            : ` This book carries no other place to record metadata, so saving cannot store your values. ${CONTAINER_LABELS.comicInfo} describes a comic archive and is not added to an EPUB.`}
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
