import { useQuery } from "@tanstack/react-query"
import { dexieDb } from "../rxdb/dexie"

export const useDownloadedFilesInfo = () =>
  useQuery({
    queryKey: ["download", "files"],
    queryFn: async () => {
      const resposne = await dexieDb.downloads.toArray()

      return resposne
    }
  })
