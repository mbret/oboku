import { useEffect, useState } from "react"
import { useMountedState } from "react-use"
import placeholder from "../assets/cover-placeholder.jpg"
import { useBook } from "./states"
import { useConfig } from "../config/useConfig"
import { useIsAuthenticated } from "../auth/useIsAuthenticated"

export const useBookCoverUrl = ({ bookId }: { bookId?: string }) => {
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

export const useBookCover = ({ bookId }: { bookId?: string }) => {
  const { coverSrc, coverSrcJpg, hasCoverMetadata } = useBookCoverUrl({
    bookId,
  })
  const isAuthenticated = useIsAuthenticated()
  const isMounted = useMountedState()
  const [hasError, setHasError] = useState(false)

  useEffect(
    function resetCoverErrorOnSourceChange() {
      void coverSrc

      setHasError(false)
    },
    [coverSrc],
  )

  useEffect(
    function retryFailedCoverWhenSessionRecovers() {
      if (isAuthenticated) {
        setHasError(false)
      }
    },
    [isAuthenticated],
  )

  const onError = () => {
    if (isMounted()) {
      setHasError(true)
    }
  }

  return {
    coverSrc: hasError ? placeholder : coverSrc,
    coverSrcJpg: hasError ? placeholder : coverSrcJpg,
    hasCoverMetadata,
    onError,
  }
}
