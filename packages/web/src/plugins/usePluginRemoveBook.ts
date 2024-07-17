import { useCallback, useRef } from "react"
import { useDatabase } from "../rxdb"
import { plugins } from "./configure"
import { useCreateRequestPopupDialog } from "./useCreateRequestPopupDialog"

export const usePluginRemoveBook = () => {
  const { db } = useDatabase()
  const createRequestPopupDialog = useCreateRequestPopupDialog()

  // It's important to use array for plugins and be careful of the order since
  // it will trigger all hooks
  const preparedHooks = plugins.map((plugin) => ({
    type: plugin.type,
    useRemoveBook:
      plugin.useRemoveBook &&
      plugin.useRemoveBook({
        requestPopup: createRequestPopupDialog({ name: plugin.name })
      })
  }))

  const getPluginFn = useRef<typeof preparedHooks>([])

  getPluginFn.current = preparedHooks

  return useCallback(
    async (bookId: string) => {
      const book = await db?.book.findOne({ selector: { _id: bookId } }).exec()
      const link = await db?.link
        .findOne({ selector: { _id: book?.links[0] ?? "-1" } })
        .exec()

      if (!link) {
        throw new Error("Link not found")
      }

      const found = getPluginFn.current.find(
        (plugin) => plugin.type === link.type
      )

      if (!found || !found.useRemoveBook) {
        throw new Error(
          "no datasource found for this link or useRemoveBook is undefined"
        )
      }

      const res = await found.useRemoveBook(link)

      return res
    },
    [getPluginFn, db]
  )
}
