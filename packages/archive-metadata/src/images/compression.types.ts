export type ImageCompressionRequest = {
  bytes: ArrayBuffer
  maxWidth: number | undefined
  maxHeight: number | undefined
}

export type ImageCompressionResponse =
  | { status: "ok"; bytes: ArrayBuffer }
  | { status: "skipped" }
