import { ComponentProps, FC, useCallback } from "react"
import { useAddBook } from "../books/helpers"
import { useDataSourcePlugin } from "../dataSources/helpers"
import { ObokuPlugin } from "@oboku/plugin-front"
import { TagsSelector } from "../tags/TagsSelector"
import { ButtonDialog } from "../common/ButtonDialog"

type UploadComponentProps = ComponentProps<
  NonNullable<ObokuPlugin[`UploadComponent`]>
>

export const UploadBookFromDataSource: FC<{
  openWith: string | undefined
  onClose: () => void
}> = ({ openWith, onClose: onFinalClose }) => {
  const [addBook] = useAddBook()
  const dataSource = useDataSourcePlugin(openWith)

  const onClose: UploadComponentProps[`onClose`] = useCallback(
    (bookToAdd) => {
      if (dataSource && bookToAdd) {
        addBook({
          book: {
            title: `Unknown`,
            tags: bookToAdd.tags
          },
          link: {
            book: null,
            data: null,
            resourceId: bookToAdd.resourceId,
            type: dataSource.type,
            createdAt: new Date().toISOString(),
            modifiedAt: null
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
        />
      )}
    </>
  )
}
