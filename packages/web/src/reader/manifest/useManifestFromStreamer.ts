import { Manifest } from "@prose-reader/shared"
import { useEffect, useState } from "react"
import { useQuery } from "reactjrx"

export const useManifestFromStreamer = ({
  bookId
}: {
  bookId: string | undefined
}) => {
  const res = useQuery({
    queryKey: ["reader/streamer/manifest", { bookId }],
    queryFn: async () => {
      const response = await fetch(
        `${window.location.origin}/streamer/${bookId}/manifest`
      )

      if (response.status === 415) {
        return null
      }

      const data: Manifest = await response.json()

      return data
    },
    staleTime: Infinity,
    retry: (_, error) => !(error instanceof Response && error.status === 415),
    enabled: !!bookId
  })

  return res
}
