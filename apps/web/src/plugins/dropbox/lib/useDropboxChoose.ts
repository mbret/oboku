import { READER_ACCEPTED_EXTENSIONS } from "@oboku/shared"
import { useCallback } from "react"
import { useLiveRef } from "reactjrx"

export const useDropboxChoose = (options: {
  onCancel?: () => void
  onSuccess: (files: readonly Dropbox.ChooserFile[]) => Promise<unknown>
  onSettled: () => void
}) => {
  const optionsRef = useLiveRef(options)

  const choose = useCallback(() => {
    if (!window.Dropbox) {
      throw new Error("Dropbox is not available")
    }

    window.Dropbox.choose({
      multiselect: true,
      extensions: READER_ACCEPTED_EXTENSIONS,
      linkType: "direct",
      cancel: () => {
        optionsRef.current?.onCancel?.()
        optionsRef.current?.onSettled?.()
      },
      success: (files) => {
        const promise =
          optionsRef.current?.onSuccess(files) ?? Promise.resolve(null)

        promise.finally(() => {
          optionsRef.current?.onSettled?.()
        })
      },
    })
  }, [optionsRef])

  return { choose }
}
