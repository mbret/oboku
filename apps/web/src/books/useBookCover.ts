import { useSignalValue } from "reactjrx"
import { authStateSignal } from "../auth/states.web"
import { useBook } from "./states"
import { configuration } from "../config/configuration"

export const useBookCover = ({ bookId }: { bookId?: string }) => {
  const auth = useSignalValue(authStateSignal)
  const { data: book } = useBook({ id: bookId })
  const assetHash = book?.lastMetadataUpdatedAt?.toString()

  const urlParams = new URLSearchParams({
    ...(assetHash && {
      hash: assetHash,
    }),
  })

  const originalSrc = bookId
    ? `${configuration.API_URL}/covers/cover-${auth?.nameHex}-${bookId}?${urlParams.toString()}`
    : undefined

  urlParams.append("format", "image/jpeg")

  const originalJpgSrc = bookId
    ? `${configuration.API_URL}/covers/cover-${auth?.nameHex}-${bookId}?${urlParams.toString()}`
    : undefined

  const coverSrc = originalSrc
  const coverSrcJpg = originalJpgSrc

  const hasCoverMetadata = !!book?.metadata?.find(
    (metadata) => metadata.coverLink,
  )

  return {
    coverSrc,
    coverSrcJpg,
    hasCoverMetadata,
  }
}
