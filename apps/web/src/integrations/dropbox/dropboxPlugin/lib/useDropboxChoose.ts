import { READER_ACCEPTED_EXTENSIONS } from "@oboku/shared"
import { useCallback } from "react"
import { useLiveRef } from "reactjrx"

export const useDropboxChoose = (options: {
  onCancel?: () => void
  onSuccess: (
    files: readonly Dropbox.ChooserFile[],
  ) => Promise<unknown> | unknown
  onSettled?: () => void
}) => {
  const optionsRef = useLiveRef(options)

  const choose = useCallback(
    ({ select }: { select: "file" | "folder" }) => {
      if (!window.Dropbox) {
        throw new Error("Dropbox is not available")
      }

      window.Dropbox.choose({
        multiselect: true,
        extensions: READER_ACCEPTED_EXTENSIONS,
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
          optionsRef.current?.onCancel?.()
          optionsRef.current?.onSettled?.()
        },
        success: async (files) => {
          try {
            await optionsRef.current?.onSuccess(files)
          } finally {
            optionsRef.current?.onSettled?.()
          }
        },
      })
    },
    [optionsRef],
  )

  return { choose }
}
