import {
  type ComponentProps,
  type DOMAttributes,
  memo,
  useCallback,
} from "react"
import { useAddBook } from "../books/helpers"
import { useDataSourcePlugin } from "../dataSources/helpers"
import { TagsSelector } from "../tags/TagsSelector"
import { ButtonDialog } from "../common/ButtonDialog"
import { useCreateRequestPopupDialog } from "../plugins/useCreateRequestPopupDialog"
import type { ObokuPlugin } from "../plugins/types"
import { signal } from "reactjrx"
import { capitalize } from "@mui/material"

type UploadBookComponentProps = ComponentProps<
  NonNullable<ObokuPlugin[`UploadBookComponent`]>
>

export const uploadBookDialogOpenedSignal = signal<string | undefined>({
  default: undefined,
})

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
    const dataSource = useDataSourcePlugin(openWith)
    const createRequestPopup = useCreateRequestPopupDialog()

    const onClose: UploadBookComponentProps[`onClose`] = useCallback(
      (bookToAdd) => {
        if (dataSource && bookToAdd) {
          addBook({
            book: {
              ...bookToAdd.book,
              tags: [],
            },
            link: {
              book: null,
              data: null,
              createdAt: new Date().toISOString(),
              modifiedAt: null,
              ...bookToAdd.link,
            },
          })
        }
        onFinalClose()
      },
      [onFinalClose, addBook, dataSource],
    )

    if (!dataSource) return null

    return (
      <>
        {dataSource.UploadBookComponent && (
          <dataSource.UploadBookComponent
            title={`Add a book with plugin ${capitalize(dataSource.name)}`}
            TagsSelector={TagsSelector}
            ButtonDialog={ButtonDialog}
            onClose={onClose}
            requestPopup={createRequestPopup({ name: dataSource.name })}
            {...rest}
          />
        )}
      </>
    )
  },
)
