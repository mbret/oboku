/**
 * @see https://www.dropbox.com/developers/chooser
 * @see https://www.dropbox.com/lp/developers/reference/oauth-guide
 */
import { memo } from "react"
import { BlockingScreen } from "../../common/BlockingBackdrop"
import { useDataSourceHelpers } from "../../dataSources/helpers"
import type { ObokuPlugin, UploadBookToAddPayload } from "../types"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { useDropboxChoose } from "./lib/useDropboxChoose"
import { useMountOnce } from "../../common/useMountOnce"

export const UploadBook: ObokuPlugin["UploadBookComponent"] = memo(
  ({ onClose }) => {
    const { generateResourceId } = useDataSourceHelpers(
      UNIQUE_RESOURCE_IDENTIFIER,
    )

    const { choose } = useDropboxChoose({
      onCancel: () => onClose(),
      onSuccess: (files) => {
        const payloads: UploadBookToAddPayload[] = files.map((doc) => ({
          book: {
            metadata: [{ type: "link", title: doc.name }],
          },
          link: {
            resourceId: generateResourceId(doc.id),
            type: `dropbox`,
          },
        }))
        onClose(payloads)
      },
    })

    useMountOnce(() => {
      choose({ select: "file" })
    })

    return <BlockingScreen />
  },
)
