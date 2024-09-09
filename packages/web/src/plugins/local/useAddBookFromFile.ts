import { useMutation } from "reactjrx"
import { useAddBook } from "../../books/helpers"
import { useDownloadBook } from "../../download/useDownloadBook"
import { PLUGIN_FILE_TYPE, PLUGIN_FILE_DATA } from "@oboku/shared"

export const useAddBookFromFile = () => {
  const [addBook] = useAddBook()
  const { mutateAsync: downloadFile } = useDownloadBook()

  return useMutation({
    mutationFn: async (file: File) => {
      const { book } =
        (await addBook({
          link: {
            book: null,
            data: {} satisfies PLUGIN_FILE_DATA,
            resourceId: "file",
            type: PLUGIN_FILE_TYPE,
            createdAt: new Date().toISOString(),
            modifiedAt: null
          },
          book: {
            metadata: [{ type: "link", title: file.name }]
          }
        })) || {}

      if (book) {
        // pre download file for this device
        await downloadFile({ ...book.toJSON(), file })
      }
    }
  })
}
