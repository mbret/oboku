import type { ImageOutputMode } from "@oboku/archive-metadata/web"
import type { FileInspection } from "./useFileInspection"
import type { MetadataFixerFormValues } from "./metadata/formValues"
import { resolveMetadataFixerFormValues } from "./metadata/identifiers/resolveMetadataFixerFormValues"

export type BookOptimizeFormValues = MetadataFixerFormValues & {
  compressImages: boolean
  imageOutputMode: ImageOutputMode
  maxWidth: string
  maxHeight: string
}

const DEFAULT_IMAGE_OUTPUT_MODE: ImageOutputMode = "original"

export const EMPTY_BOOK_OPTIMIZE_FORM_VALUES: BookOptimizeFormValues = {
  identifiers: [],
  compressImages: false,
  imageOutputMode: DEFAULT_IMAGE_OUTPUT_MODE,
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

export const hasImageCompressionOperation = (
  values: BookOptimizeFormValues,
): boolean =>
  values.imageOutputMode !== "original" || hasCompressionDimension(values)

export const resolveBookOptimizeFormValues = (
  inspection: FileInspection,
): BookOptimizeFormValues => ({
  ...resolveMetadataFixerFormValues(inspection),
  compressImages: false,
  imageOutputMode: DEFAULT_IMAGE_OUTPUT_MODE,
  maxWidth: "",
  maxHeight: "",
})
