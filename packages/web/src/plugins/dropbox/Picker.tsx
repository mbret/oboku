/**
 * @see https://www.dropbox.com/developers/chooser
 * @see https://www.dropbox.com/lp/developers/reference/oauth-guide
 */
import { type FC, useEffect } from "react"

/**
 * @todo migrate to `useDropboxChoose`
 */
export const Picker: FC<{
  onClose: (files?: readonly Dropbox.ChooserFile[]) => void
  select?: "file" | "folder"
  multiselect?: boolean
}> = ({ onClose, multiselect = true, select = "file" }) => {
  useEffect(() => {
    if (!window.Dropbox) {
      throw new Error("Dropbox is not available")
    }

    window.Dropbox?.choose?.({
      multiselect,
      ...(select === "folder" && {
        // Optional. A value of false (default) limits selection to files,
        // while true allows the user to select both folders and files.
        // You cannot specify `linkType: "direct"` when using `folderselect: true`.
        folderselect: true,
        extensions: [".folder"], // a trick to only allow folder
        // sizeLimit: 1,
      }),
      ...(select === "file" && {
        linkType: "direct",
      }),
      cancel: () => {
        onClose()
      },
      success: (files) => {
        onClose(files)
      },
    })
  }, [onClose, multiselect, select])

  return null
}
