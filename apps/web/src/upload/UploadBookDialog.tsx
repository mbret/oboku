import { type DOMAttributes, memo, useCallback } from "react"
import { useAddBook } from "../books/helpers"
import { useDownloadBook } from "../download/useDownloadBook"
import { useSourcePlugin } from "../integrations/plugins/useSourcePlugin"
import { TagsSelector } from "../tags/TagsSelector"
import { useCreateRequestPopupDialog } from "../integrations/plugins/useCreateRequestPopupDialog"
import type {
  UploadBookComponentProps,
  UploadBookToAddPayload,
} from "../integrations/plugins/types"
import { signal } from "reactjrx"
import { Logger } from "../debug/logger.shared"
import { isCancelError } from "../errors/errors.shared"

export const uploadBookDialogOpenedSignal = signal<string | undefined>({})

export const UploadBookDialog = memo(function UploadBookDialog({
  openWith,
  onClose: onFinalClose,
  ...rest
}: {
  openWith: string | undefined
  onClose: () => void
} & DOMAttributes<any>) {
  // React Compiler cannot lower this function yet, so it bails out here.
  // TODO: re-check on a newer React Compiler; drop this opt-out once it compiles.
  "use no memo"

  const [addBook] = useAddBook()
  const { mutateAsync: downloadFile } = useDownloadBook()
  const sourcePlugin = useSourcePlugin(openWith)
  const createRequestPopup = useCreateRequestPopupDialog()

  const onClose: UploadBookComponentProps[`onClose`] = useCallback(
    (booksToAdd?: ReadonlyArray<UploadBookToAddPayload>) => {
      onFinalClose()

      if (!sourcePlugin || !booksToAdd?.length) {
        return
      }

      const addBooksInBackground = async () => {
        for (const bookToAdd of booksToAdd) {
          try {
            const result = await addBook({
              book: {
                ...bookToAdd.book,
                tags: [],
              },
              link: {
                book: null,
                createdAt: new Date().toISOString(),
                modifiedAt: null,
                ...bookToAdd.link,
                data:
                  bookToAdd.link.type === "URI"
                    ? (bookToAdd.link.data ?? {})
                    : (bookToAdd.link.data ?? null),
              },
            })

            if (bookToAdd.file && result?.book) {
              const json = result.book.toJSON()
              await downloadFile({
                _id: json._id,
                links: json.links,
                file: bookToAdd.file,
              })
            }
          } catch (error) {
            if (!isCancelError(error)) {
              Logger.error(error)
            }
          }
        }
      }

      void addBooksInBackground()
    },
    [onFinalClose, addBook, downloadFile, sourcePlugin],
  )

  if (!sourcePlugin) return null

  return (
    <>
      {sourcePlugin.UploadBookComponent && (
        <sourcePlugin.UploadBookComponent
          title={`Add a book from ${sourcePlugin.name}`}
          TagsSelector={TagsSelector}
          onClose={onClose}
          requestPopup={createRequestPopup({ name: sourcePlugin.name })}
          {...rest}
        />
      )}
    </>
  )
})
