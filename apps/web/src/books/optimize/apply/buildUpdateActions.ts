import type { WebArchiveUpdateAction } from "@oboku/archive-metadata/web"
import type { FileInspection } from "../useFileInspection"
import {
  hasWritableMetadataTarget,
  resolveArchiveMetadataPatchPlan,
  resolveMetadataFixerFormValues,
  trimMetadataFixerFormValues,
} from "../metadata/targets"
import {
  hasImageCompressionOperation,
  parseDimension,
  type BookOptimizeFormValues,
} from "../form"

const resolveMetadataPatchAction = (
  values: BookOptimizeFormValues,
  inspection: FileInspection,
): WebArchiveUpdateAction | undefined => {
  if (!hasWritableMetadataTarget(inspection)) return undefined

  const trimmed = trimMetadataFixerFormValues(values)
  const resolved = resolveMetadataFixerFormValues(inspection)

  if (trimmed.isbn === resolved.isbn) return undefined

  const { patch, targets } = resolveArchiveMetadataPatchPlan(
    trimmed,
    inspection,
  )

  return { kind: "patch-metadata", patch, targets }
}

const resolveCompressImagesAction = (
  values: BookOptimizeFormValues,
): WebArchiveUpdateAction | undefined => {
  if (!values.compressImages || !hasImageCompressionOperation(values))
    return undefined

  return {
    kind: "compress-images",
    config: {
      maxWidth: parseDimension(values.maxWidth),
      maxHeight: parseDimension(values.maxHeight),
      outputMode: values.imageOutputMode,
    },
  }
}

export const buildUpdateActions = (
  values: BookOptimizeFormValues,
  inspection: FileInspection,
): WebArchiveUpdateAction[] =>
  [
    resolveMetadataPatchAction(values, inspection),
    resolveCompressImagesAction(values),
  ].filter((action): action is WebArchiveUpdateAction => action !== undefined)
