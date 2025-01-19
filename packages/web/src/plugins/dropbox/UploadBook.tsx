/**
 * @see https://www.dropbox.com/developers/chooser
 * @see https://www.dropbox.com/lp/developers/reference/oauth-guide
 */
import { FC, memo, useEffect, useRef } from "react"
import { Report } from "../../debug/report.shared"
import { BlockingScreen } from "../../common/BlockingBackdrop"
import { useAddBook } from "../../books/helpers"
import { useDataSourceHelpers } from "../../dataSources/helpers"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { useIsMounted } from "./lib/useIsMounted"
import { READER_ACCEPTED_EXTENSIONS } from "@oboku/shared"

export const UploadBook: FC<{
  onClose: () => void
}> = memo(({ onClose }) => {
  const [addBook] = useAddBook()
  const isMounted = useIsMounted()
  const isOpened = useRef(false)
  const { generateResourceId } = useDataSourceHelpers(
    UNIQUE_RESOURCE_IDENTIFIER
  )

  useEffect(() => {
    if (isOpened.current) return

    if (window.Dropbox) {
      isOpened.current = true

      window.Dropbox.choose({
        multiselect: true,
        extensions: READER_ACCEPTED_EXTENSIONS,
        linkType: "direct",
        cancel: function () {
          if (!isMounted()) return

          onClose()
        },
        success: (files) => {
          if (!isMounted()) return

          Promise.all(
            files.map((doc) =>
              addBook({
                book: {
                  metadata: [
                    {
                      type: "link",
                      title: doc.name
                    }
                  ]
                },
                link: {
                  book: null,
                  data: null,
                  resourceId: generateResourceId(doc.id),
                  type: `dropbox`,
                  createdAt: new Date().toISOString(),
                  modifiedAt: null
                }
              }).catch(Report.error)
            )
          ).then(() => {
            onClose()
          })
        }
      })
    }
  }, [onClose, generateResourceId, addBook, isOpened, isMounted])

  return (
    <>
      <BlockingScreen />
    </>
  )
})
