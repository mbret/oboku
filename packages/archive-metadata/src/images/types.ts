export type ImageOutputMode = "avif" | "original" | "webp"

export type ConvertedImageOutputMode = Exclude<ImageOutputMode, "original">

export type ImageCompressionConfig = {
  maxWidth: number | undefined
  maxHeight: number | undefined
  outputMode: ImageOutputMode
}

export type ImageCompressionResult = {
  totalImages: number
  compressedCount: number
  skippedCount: number
}
