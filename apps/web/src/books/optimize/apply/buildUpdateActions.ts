import type { WebArchiveUpdateAction } from "@oboku/archive-metadata/web"
import type { FileInspection } from "../useFileInspection"
import {
  resolveArchiveMetadataPatchPlan,
  resolveMetadataFixerFormValues,
  trimMetadataFixerFormValues,
} from "../metadata/targets"
import type { BookOptimizeFormValues } from "../form"

const resolveMetadataPatchAction = (
  values: BookOptimizeFormValues,
  inspection: FileInspection,
): WebArchiveUpdateAction | undefined => {
  const trimmed = trimMetadataFixerFormValues(values)
  const resolved = resolveMetadataFixerFormValues(inspection)

  if (trimmed.isbn === resolved.isbn) return undefined

  const { patch, targets } = resolveArchiveMetadataPatchPlan(
    trimmed,
    inspection,
  )

  return { kind: "patch-metadata", patch, targets }
}

export const buildUpdateActions = (
  values: BookOptimizeFormValues,
  inspection: FileInspection,
): WebArchiveUpdateAction[] =>
  [resolveMetadataPatchAction(values, inspection)].filter(
    (action): action is WebArchiveUpdateAction => action !== undefined,
  )
