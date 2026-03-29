import { useCallback } from "react"
import { useDatabase } from "../rxdb"
import { useCreateRequestPopupDialog } from "./useCreateRequestPopupDialog"
import { pluginsByType } from "./configure"

export const usePluginRemoveBook = () => {
  const { db } = useDatabase()
  const createRequestPopupDialog = useCreateRequestPopupDialog()
  const removeBookFromWebdav = pluginsByType.webdav.useRemoveBook({
    requestPopup: createRequestPopupDialog({ name: "webdav" }),
  })
  const removeBookFromDropbox = pluginsByType.dropbox.useRemoveBook({
    requestPopup: createRequestPopupDialog({ name: "dropbox" }),
  })
  const removeBookFromSynologyDrive = pluginsByType[
    "synology-drive"
  ].useRemoveBook({
    requestPopup: createRequestPopupDialog({ name: "synology-drive" }),
  })
  const removeBookFromDrive = pluginsByType.DRIVE.useRemoveBook({
    requestPopup: createRequestPopupDialog({ name: "DRIVE" }),
  })
  const removeBookFromFile = pluginsByType.file.useRemoveBook({
    requestPopup: createRequestPopupDialog({ name: "file" }),
  })
  const removeBookFromUri = pluginsByType.URI.useRemoveBook({
    requestPopup: createRequestPopupDialog({ name: "URI" }),
  })
  const removeBookFromServer = pluginsByType.server.useRemoveBook({
    requestPopup: createRequestPopupDialog({ name: "server" }),
  })

  return useCallback(
    async (bookId: string) => {
      const book = await db?.book.findOne({ selector: { _id: bookId } }).exec()
      const link = await db?.link
        .findOne({ selector: { _id: book?.links[0] ?? "-1" } })
        .exec()

      if (!link) {
        throw new Error("Link not found")
      }

      switch (link.type) {
        case "webdav":
          return removeBookFromWebdav(link)
        case "synology-drive":
          return removeBookFromSynologyDrive(link)
        case "dropbox":
          return removeBookFromDropbox(link)
        case "DRIVE":
          return removeBookFromDrive(link)
        case "file":
          return removeBookFromFile(link)
        case "URI":
          return removeBookFromUri(link)
        case "server":
          return removeBookFromServer(link)
      }
    },
    [
      db,
      removeBookFromDrive,
      removeBookFromDropbox,
      removeBookFromFile,
      removeBookFromServer,
      removeBookFromSynologyDrive,
      removeBookFromUri,
      removeBookFromWebdav,
    ],
  )
}
