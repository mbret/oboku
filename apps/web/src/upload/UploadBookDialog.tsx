import {
  type ComponentProps,
  type DOMAttributes,
  memo,
  useCallback,
} from "react"
import { useAddBook } from "../books/helpers"
import { useDownloadBook } from "../download/useDownloadBook"
import { useDataSourcePlugin } from "../dataSources/helpers"
import { TagsSelector } from "../tags/TagsSelector"
import { useCreateRequestPopupDialog } from "../plugins/useCreateRequestPopupDialog"
import type { ObokuPlugin, UploadBookToAddPayload } from "../plugins/types"
import { signal } from "reactjrx"
import { capitalize } from "@mui/material"

type UploadBookComponentProps = ComponentProps<
  NonNullable<ObokuPlugin[`UploadBookComponent`]>
>

export const uploadBookDialogOpenedSignal = signal<string | undefined>({})

export const UploadBookDialog = memo(
  ({
    openWith,
    onClose: onFinalClose,
    ...rest
  }: {
    openWith: string | undefined
    onClose: () => void
  } & DOMAttributes<any>) => {
    const [addBook] = useAddBook()
    const { mutateAsync: downloadFile } = useDownloadBook()
    const dataSource = useDataSourcePlugin(openWith)
    const createRequestPopup = useCreateRequestPopupDialog()

    const onClose: UploadBookComponentProps[`onClose`] = useCallback(
      async (booksToAdd?: ReadonlyArray<UploadBookToAddPayload>) => {
        if (dataSource && booksToAdd?.length) {
          for (const bookToAdd of booksToAdd) {
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
          }
        }
        onFinalClose()
      },
      [onFinalClose, addBook, downloadFile, dataSource],
    )

    if (!dataSource) return null

    return (
      <>
        {dataSource.UploadBookComponent && (
          <dataSource.UploadBookComponent
            title={`Add a book with plugin ${capitalize(dataSource.name)}`}
            TagsSelector={TagsSelector}
            onClose={onClose}
            requestPopup={createRequestPopup({ name: dataSource.name })}
            {...rest}
          />
        )}
      </>
    )
  },
)
