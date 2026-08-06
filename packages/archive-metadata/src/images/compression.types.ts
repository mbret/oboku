import type {
  ConvertedImageMediaType,
  PreservableImageMediaType,
} from "./paths"

export type ImageOutputMediaType =
  | ConvertedImageMediaType
  | PreservableImageMediaType

export type ImageCompressionRequest = {
  bytes: ArrayBuffer
  maxWidth: number | undefined
  maxHeight: number | undefined
  outputType: ImageOutputMediaType
  skipIfUnscaled: boolean
}

export type ImageCompressionOptions = Omit<ImageCompressionRequest, "bytes">

export type ImageCompressionResponse =
  | { status: "ok"; bytes: ArrayBuffer }
  | { status: "skipped" }
