/**
 * @see https://www.dropbox.com/developers/chooser
 * @see https://www.dropbox.com/lp/developers/reference/oauth-guide
 */
import { FC, useEffect } from "react"
import { useAddBook } from "../../books/helpers"
import { DropboxFile } from "./types"
import { useDataSourceHelpers } from "../../dataSources/helpers"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./constants"

export const Picker: FC<{
  onClose: (files?: DropboxFile[]) => void
  select?: "file" | "folder"
  multiselect?: boolean
}> = ({ onClose, multiselect = true, select = "file" }) => {
  const [addBook] = useAddBook()
  const { generateResourceId } = useDataSourceHelpers(
    UNIQUE_RESOURCE_IDENTIFIER
  )

  useEffect(() => {
    // @ts-ignore
    if (Dropbox) {
      // @ts-ignore
      Dropbox.choose &&
        // @ts-ignore
        Dropbox.choose({
          multiselect,
          ...(select === "folder" && {
            // Optional. A value of false (default) limits selection to files,
            // while true allows the user to select both folders and files.
            // You cannot specify `linkType: "direct"` when using `folderselect: true`.
            folderselect: true,
            extensions: [".folder"] // a trick to only allow folder
            // sizeLimit: 1,
          }),
          ...(select === "file" && {
            linkType: "direct"
          }),
          cancel: function () {
            onClose()
          },
          success: async (files: DropboxFile[]) => {
            onClose(files)
          }
        })
    }
  }, [onClose, generateResourceId, addBook, multiselect, select])

  return null
}
