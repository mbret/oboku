import { useMutation } from "reactjrx"
import { useAddBook } from "../../books/helpers"
import { useDownloadBook } from "../../download/useDownloadBook"
import { PLUGIN_FILE_TYPE } from "."

export const useAddBookFromFile = () => {
  const [addBook] = useAddBook()
  const downloadFile = useDownloadBook()

  return useMutation({
    mutationFn: async (file: File) => {
      const { book } =
        (await addBook({
          link: {
            book: null,
            data: null,
            resourceId: "file",
            type: PLUGIN_FILE_TYPE,
            createdAt: new Date().toISOString(),
            modifiedAt: null
          },
          book: {
            title: file.name,
            lastMetadataUpdatedAt: Date.now()
          }
        })) || {}

      if (book) {
        await downloadFile(book, file)
      }
    }
  })
}
