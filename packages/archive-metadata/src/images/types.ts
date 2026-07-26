export type ImageCompressionConfig = {
  maxWidth: number | undefined
  maxHeight: number | undefined
}

export type ImageCompressionResult = {
  totalImages: number
  compressedCount: number
  skippedCount: number
}
