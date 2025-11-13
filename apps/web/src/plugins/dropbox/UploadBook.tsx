/**
 * @see https://www.dropbox.com/developers/chooser
 * @see https://www.dropbox.com/lp/developers/reference/oauth-guide
 */
import { type FC, memo } from "react"
import { BlockingScreen } from "../../common/BlockingBackdrop"
import { useAddBook } from "../../books/helpers"
import { useDataSourceHelpers } from "../../dataSources/helpers"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { useDropboxChoose } from "./lib/useDropboxChoose"
import { useMutation$ } from "reactjrx"
import { defaultIfEmpty, from } from "rxjs"
import { useMountOnce } from "../../common/useMountOnce"

export const UploadBook: FC<{
  onClose: () => void
}> = memo(({ onClose }) => {
  const [addBook] = useAddBook()
  const { generateResourceId } = useDataSourceHelpers(
    UNIQUE_RESOURCE_IDENTIFIER,
  )

  const { mutateAsync: addBooks } = useMutation$({
    mutationFn: (files: readonly Dropbox.ChooserFile[]) => {
      const promises = files.map((doc) =>
        addBook({
          book: {
            metadata: [
              {
                type: "link",
                title: doc.name,
              },
            ],
          },
          link: {
            book: null,
            data: null,
            resourceId: generateResourceId(doc.id),
            type: `dropbox`,
            createdAt: new Date().toISOString(),
            modifiedAt: null,
          },
        }),
      )

      return from(Promise.all(promises)).pipe(defaultIfEmpty(null))
    },
  })

  const { choose } = useDropboxChoose({
    onSettled: onClose,
    onSuccess: addBooks,
  })

  useMountOnce(() => {
    choose({ select: "file" })
  })

  return <BlockingScreen />
})
