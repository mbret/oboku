import type { FileInspection } from "./useFileInspection"
import {
  EMPTY_METADATA_FIXER_FORM_VALUES,
  resolveMetadataFixerFormValues,
} from "./metadata/targets"
import type { MetadataFixerFormValues } from "./metadata/types"

export type BookOptimizeFormValues = MetadataFixerFormValues

export const EMPTY_BOOK_OPTIMIZE_FORM_VALUES: BookOptimizeFormValues =
  EMPTY_METADATA_FIXER_FORM_VALUES

export const resolveBookOptimizeFormValues = (
  inspection: FileInspection,
): BookOptimizeFormValues => resolveMetadataFixerFormValues(inspection)
