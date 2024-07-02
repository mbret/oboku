import { getBookFile } from "./getBookFile.shared"
import { useQuery } from "reactjrx"

export const useBookFile = ({
  bookId,
  enabled
}: {
  bookId?: string
  enabled?: boolean
}) => {
  return useQuery({
    queryKey: ["bookFile", bookId],
    enabled: enabled !== false && !!bookId,
    queryFn: async () => {
      const file = await getBookFile(bookId ?? "-1")

      if (!file) {
        throw new Error("No book file found")
      }

      return file
    },
    networkMode: "always",
    gcTime: 0,
    staleTime: Infinity,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  })
}
