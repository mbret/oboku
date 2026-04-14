import { useMutation } from "@tanstack/react-query"
import { useNetworkState } from "react-use"
import { lock } from "../common/locks/utils"
import { useRemoveDownloadFile } from "../download/useRemoveDownloadFile"
import { OfflineError } from "../errors/errors.shared"
import { usePluginRemoveBook } from "../plugins/usePluginRemoveBook"
import { useDatabase } from "../rxdb"

export const useRemoveBook = () => {
  const { mutateAsync: removeDownload } = useRemoveDownloadFile()
  const { db } = useDatabase()
  const removeBookFromDataSource = usePluginRemoveBook()
  const network = useNetworkState()

  return useMutation({
    mutationFn: async ({
      id,
      deleteFromDataSource,
    }: {
      id: string
      deleteFromDataSource?: boolean
    }) => {
      if (deleteFromDataSource) {
        if (!network.online) {
          throw new OfflineError()
        }

        await removeBookFromDataSource(id)
      }

      const releaseLock = lock()

      try {
        await Promise.all([
          removeDownload({ bookId: id }),
          db?.book.findOne({ selector: { _id: id } }).remove(),
        ])
      } finally {
        releaseLock()
      }
    },
  })
}
