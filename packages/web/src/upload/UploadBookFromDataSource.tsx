import { ComponentProps, DOMAttributes, FC, memo, useCallback } from "react"
import { useAddBook } from "../books/helpers"
import { useDataSourcePlugin } from "../dataSources/helpers"
import { TagsSelector } from "../tags/TagsSelector"
import { ButtonDialog } from "../common/ButtonDialog"
import { useCreateRequestPopupDialog } from "../plugins/useCreateRequestPopupDialog"
import { ObokuPlugin } from "../plugins/types"
import { useMount } from "react-use"

type UploadComponentProps = ComponentProps<
  NonNullable<ObokuPlugin[`UploadComponent`]>
>

export const UploadBookFromDataSource = memo(
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

    const onClose: UploadComponentProps[`onClose`] = useCallback(
      (bookToAdd) => {
        if (dataSource && bookToAdd) {
          addBook({
            book: {
              ...bookToAdd.book,
              tags: []
            },
            link: {
              book: null,
              data: null,
              createdAt: new Date().toISOString(),
              modifiedAt: null,
              ...bookToAdd.link
            }
          })
        }
        onFinalClose()
      },
      [onFinalClose, addBook, dataSource]
    )

    if (!dataSource) return null

    return (
      <>
        {dataSource.UploadComponent && (
          <dataSource.UploadComponent
            title={`Add a book with ${dataSource.name}`}
            TagsSelector={TagsSelector}
            ButtonDialog={ButtonDialog}
            onClose={onClose}
            requestPopup={createRequestPopup({ name: dataSource.name })}
            {...rest}
          />
        )}
      </>
    )
  }
)
