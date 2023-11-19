import localforage from "localforage"
import { useQuery } from "reactjrx"

export const useDownloadedFilesInfo = () =>
  useQuery({
    queryKey: ["download", "files"],
    queryFn: async () => {
      const keys = await localforage.keys()

      return keys
        .filter((name) => name.startsWith(`book-download`))
        .map((name) => name.replace(`book-download-`, ``))
    }
  })
