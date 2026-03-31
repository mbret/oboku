import { useCallback, useEffect } from "react"
import { SIGNAL_RESET, useSignalValue } from "reactjrx"
import {
  uploadBookDialogOpenedSignal,
  UploadBookDialog,
} from "./UploadBookDialog"
import { PLUGIN_FILE_TYPE } from "@oboku/shared"

export const UploadBookDialogWithDragOver = () => {
  const openWith = useSignalValue(uploadBookDialogOpenedSignal)

  useEffect(() => {
    const onDragOver = () => {
      if (!uploadBookDialogOpenedSignal.getValue()) {
        uploadBookDialogOpenedSignal.setValue(PLUGIN_FILE_TYPE)
      }
    }

    document.addEventListener("dragover", onDragOver)

    return () => document.removeEventListener("dragover", onDragOver)
  }, [])

  const onDragLeave = useCallback(() => {
    if (uploadBookDialogOpenedSignal.getValue() === PLUGIN_FILE_TYPE) {
      uploadBookDialogOpenedSignal.setValue(SIGNAL_RESET)
    }
  }, [])

  const onClose = useCallback(() => {
    uploadBookDialogOpenedSignal.setValue(SIGNAL_RESET)
  }, [])

  if (!openWith) return null

  return (
    <UploadBookDialog
      openWith={openWith}
      {...(openWith === PLUGIN_FILE_TYPE && { onDragLeave })}
      onClose={onClose}
    />
  )
}
