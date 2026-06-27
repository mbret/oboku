export type DownloadFlowRequest = {
  abortController: AbortController
  bookId: string
  file?: File
  id: string
  links: readonly string[]
  reject: (error: unknown) => void
  resolve: () => void
}
