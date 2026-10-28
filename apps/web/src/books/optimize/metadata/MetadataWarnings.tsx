import { Alert, Stack } from "@mui/material"
import { memo } from "react"
import { useWatch } from "react-hook-form"
import { useBookOptimize } from "../BookOptimizeProvider"
import {
  CONTAINER_LABELS,
  hasWritableMetadataTarget,
  identifierDestinations,
  resolveMetadataTargets,
} from "./identifiers/containers"
import { identifierSchemeLabel } from "./identifiers/schemes"

export const MetadataWarnings = memo(function MetadataWarnings() {
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

  const { control, inspection } = useBookOptimize()
  const { unreadableSources } = inspection.resolvedArchive
  const identifiers = useWatch({ control, name: "identifiers" })
  const targets = resolveMetadataTargets(inspection)
  const destinations = identifierDestinations(identifiers, targets)
  const droppedIdentifiers = hasWritableMetadataTarget(inspection)
    ? identifiers.filter(function isCompleteAndUnstorable(
        { scheme, value },
        index,
      ) {
        return (
          scheme.trim() !== "" &&
          value.trim() !== "" &&
          destinations[index]?.length === 0
        )
      })
    : []

  if (unreadableSources.length === 0 && droppedIdentifiers.length === 0)
    return null

  return (
    <Stack spacing={1}>
      {unreadableSources.includes("opf") && (
        <Alert severity="warning" variant="standard">
          This book&apos;s {CONTAINER_LABELS.opf} could not be read, so none of
          its own identifiers could be recovered and nothing can be saved back
          to it. Editing it anyway would mean replacing it, which would cost the
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
      {droppedIdentifiers.length > 0 && (
        <Alert severity="warning" variant="standard">
          There is no writable {CONTAINER_LABELS.opf} in this book, and{" "}
          {CONTAINER_LABELS.comicInfo} has no field left for{" "}
          {droppedIdentifiers
            .map(function describeIdentifier({ scheme, value }) {
              return `${identifierSchemeLabel(scheme)} ${value}`
            })
            .join(", ")}
          . Saving will drop {droppedIdentifiers.length > 1 ? "them" : "it"}.
        </Alert>
      )}
    </Stack>
  )
})
