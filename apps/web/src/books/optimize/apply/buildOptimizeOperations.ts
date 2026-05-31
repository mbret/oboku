import type { FileInspection } from "../useFileInspection"
import {
  resolveArchiveMetadataPatchPlans,
  resolveMetadataFixerFormValues,
  trimMetadataFixerFormValues,
} from "../metadata/targets"
import {
  hasCompressionDimension,
  parseDimension,
  type BookOptimizeFormValues,
} from "../form"
import type { OptimizeOperation } from "./operations"

const resolveMetadataPatchOperation = (
  values: BookOptimizeFormValues,
  inspection: FileInspection | undefined,
): OptimizeOperation | undefined => {
  if (!inspection || inspection.metadataReadFailed) return undefined

  const trimmed = trimMetadataFixerFormValues(values)
  const resolved = resolveMetadataFixerFormValues(inspection)
  const metadataChanged =
    trimmed.comicInfoIsbn !== resolved.comicInfoIsbn ||
    trimmed.opfIsbn !== resolved.opfIsbn

  if (!metadataChanged) return undefined

  return {
    kind: "metadata-patch",
    patches: resolveArchiveMetadataPatchPlans(trimmed, inspection),
  }
}

const resolveCompressOperation = (
  values: BookOptimizeFormValues,
): OptimizeOperation | undefined => {
  if (!values.compressImages || !hasCompressionDimension(values))
    return undefined

  return {
    kind: "compress-images",
    config: {
      maxWidth: parseDimension(values.maxWidth),
      maxHeight: parseDimension(values.maxHeight),
    },
  }
}

export const buildOptimizeOperations = (
  values: BookOptimizeFormValues,
  inspection: FileInspection | undefined,
): OptimizeOperation[] =>
  [
    resolveMetadataPatchOperation(values, inspection),
    resolveCompressOperation(values),
  ].filter(
    (operation): operation is OptimizeOperation => operation !== undefined,
  )
