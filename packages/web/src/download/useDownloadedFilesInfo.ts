import localforage from "localforage"
import { useQuery } from "reactjrx"

export const useDownloadedFilesInfo = () => {
  return useQuery(["download", "files"], async () => {
    const keys = await localforage.keys()

    return keys
      .filter((name) => name.startsWith(`book-download`))
      .map((name) => name.replace(`book-download-`, ``))
  })
}
