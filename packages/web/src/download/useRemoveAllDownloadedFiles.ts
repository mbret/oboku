import { useCallback } from "react"
import { useDatabase } from "../rxdb"
import { useRemoveDownloadFile } from "./useRemoveDownloadFile"
import { plugin } from "../plugins/local"

export const useRemoveAllDownloadedFiles = () => {
  const { db } = useDatabase()
  const { mutateAsync: removeDownloadFile } = useRemoveDownloadFile()

  return useCallback(
    async (bookIds: string[]) => {
      return await Promise.all(
        bookIds.map(async (id) => {
          const book = await db?.book
            .findOne({
              selector: {
                _id: id
              }
            })
            .exec()

          const linkIds = book?.links ?? []

          if (linkIds.length > 0) {
            const links = await db?.link.findByIds(linkIds).exec()

            const fileLink = Array.from(links?.values() ?? []).find(
              ({ type }) => type === plugin.type
            )

            if (fileLink) return
          }

          return removeDownloadFile({ bookId: id })
        })
      )
    },
    [db, removeDownloadFile]
  )
}
