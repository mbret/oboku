import { useQuery } from "reactjrx"
import { useBookFile } from "../../download/useBookFile"
import { getArchiveForRarFile } from "./getArchiveForFile.shared"
import { useEffect } from "react"

export const useArchiveForRarFile = ({
  bookId,
  enabled
}: {
  bookId?: string
  enabled?: boolean
}) => {
  const { data: bookFile } = useBookFile({
    bookId,
    enabled
  })

  const res = useQuery({
    queryKey: ["streamer/archive/rar", bookId],
    enabled: !!bookFile,
    queryFn: async () => {
      if (!bookFile) throw new Error()

      return await getArchiveForRarFile(bookFile)
    },
    networkMode: "always",
    gcTime: 0,
    staleTime: Infinity,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  })

  const { data } = res

  useEffect(() => {
    return () => {
      data?.close()
    }
  }, [data])

  return res
}
