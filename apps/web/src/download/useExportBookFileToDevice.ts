import { useMutation } from "@tanstack/react-query"
import { getBookFile } from "./getBookFile.shared"

const saveFileToDevice = (file: File) => {
  const objectUrl = URL.createObjectURL(file)
  const anchor = document.createElement("a")

  anchor.href = objectUrl
  anchor.download = file.name
  anchor.click()

  setTimeout(function releaseObjectUrlOnceDownloadStarted() {
    URL.revokeObjectURL(objectUrl)
  })
}

export const useExportBookFileToDevice = (bookId: string) => {
  const { mutate: exportBookFileToDevice, isPending: isExportingToDevice } =
    useMutation({
      mutationFn: async function saveDownloadedBookFileToDevice() {
        const cached = await getBookFile(bookId)

        if (!cached) {
          throw new Error(`Cannot export: no cached file for book ${bookId}`)
        }

        saveFileToDevice(cached.data)
      },
    })

  return { exportBookFileToDevice, isExportingToDevice }
}
