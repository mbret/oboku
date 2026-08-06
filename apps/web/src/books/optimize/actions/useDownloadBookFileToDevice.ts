import { useMutation } from "@tanstack/react-query"
import { getBookFile } from "../../../download/getBookFile.shared"

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

export const useDownloadBookFileToDevice = (bookId: string) => {
  const { mutate: downloadBookFileToDevice, isPending: isDownloadingToDevice } =
    useMutation({
      mutationFn: async function saveLocalBookFileToDevice() {
        const cached = await getBookFile(bookId)

        if (!cached) {
          throw new Error(`Cannot download: no cached file for book ${bookId}`)
        }

        saveFileToDevice(cached.data)
      },
    })

  return { downloadBookFileToDevice, isDownloadingToDevice }
}
