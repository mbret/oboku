import type { FileInspection } from "./useFileInspection"
import {
  EMPTY_METADATA_FIXER_FORM_VALUES,
  resolveMetadataFixerFormValues,
} from "./metadata/targets"
import type { MetadataFixerFormValues } from "./metadata/types"

export type BookOptimizeFormValues = MetadataFixerFormValues & {
  compressImages: boolean
  maxWidth: string
  maxHeight: string
}

export const EMPTY_BOOK_OPTIMIZE_FORM_VALUES: BookOptimizeFormValues = {
  ...EMPTY_METADATA_FIXER_FORM_VALUES,
  compressImages: false,
  maxWidth: "",
  maxHeight: "",
}

export const parseDimension = (value: string): number | undefined => {
  const dimension = Math.round(Number(value))

  if (!Number.isFinite(dimension) || dimension <= 0) return undefined

  return dimension
}

export const hasCompressionDimension = (
  values: BookOptimizeFormValues,
): boolean =>
  parseDimension(values.maxWidth) !== undefined ||
  parseDimension(values.maxHeight) !== undefined

export const resolveBookOptimizeFormValues = (
  inspection: FileInspection,
): BookOptimizeFormValues => ({
  ...resolveMetadataFixerFormValues(inspection),
  compressImages: false,
  maxWidth: "",
  maxHeight: "",
})
