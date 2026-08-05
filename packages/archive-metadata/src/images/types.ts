export type ImageOutputMode = "webp" | "original"

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
