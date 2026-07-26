import type { FileInspection } from "../useFileInspection"
import {
  resolveArchiveMetadataPatchPlan,
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
  inspection: FileInspection,
): OptimizeOperation | undefined => {
  const trimmed = trimMetadataFixerFormValues(values)
  const resolved = resolveMetadataFixerFormValues(inspection)

  if (trimmed.isbn === resolved.isbn) return undefined

  return {
    kind: "metadata-patch",
    plan: resolveArchiveMetadataPatchPlan(trimmed, inspection),
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
  inspection: FileInspection,
): OptimizeOperation[] =>
  [
    resolveMetadataPatchOperation(values, inspection),
    resolveCompressOperation(values),
  ].filter(
    (operation): operation is OptimizeOperation => operation !== undefined,
  )
