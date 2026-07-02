import { useBook } from "./states"
import { useConfig } from "../config/useConfig"

export const useBookCover = ({ bookId }: { bookId?: string }) => {
  const { data: config } = useConfig()
  const { data: book } = useBook({ id: bookId })
  const assetHash = book?.lastMetadataUpdatedAt?.toString()

  const urlParams = new URLSearchParams({
    ...(assetHash && {
      hash: assetHash,
    }),
  })

  const coverSrc = bookId
    ? `${config?.API_URL}/covers/books/${bookId}?${urlParams.toString()}`
    : undefined

  urlParams.append("format", "image/jpeg")

  const coverSrcJpg = bookId
    ? `${config?.API_URL}/covers/books/${bookId}?${urlParams.toString()}`
    : undefined

  const hasCoverMetadata = !!book?.metadata?.find(
    (metadata) => metadata.coverLink,
  )

  return {
    coverSrc,
    coverSrcJpg,
    hasCoverMetadata,
  }
}
