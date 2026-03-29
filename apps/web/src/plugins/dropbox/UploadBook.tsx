/**
 * @see https://www.dropbox.com/developers/chooser
 * @see https://www.dropbox.com/lp/developers/reference/oauth-guide
 */
import { memo } from "react"
import { BlockingScreen } from "../../common/BlockingBackdrop"
import type { ObokuPlugin, UploadBookToAddPayload } from "../types"
import { useDropboxChoose } from "./lib/useDropboxChoose"
import { useMountOnce } from "../../common/useMountOnce"

export const UploadBook: ObokuPlugin<"dropbox">["UploadBookComponent"] = memo(
  ({ onClose }) => {
    const { choose } = useDropboxChoose({
      onCancel: () => onClose(),
      onSuccess: (files) => {
        const payloads: UploadBookToAddPayload<"dropbox">[] = files.map(
          (doc) => ({
            book: {
              metadata: [{ type: "link", title: doc.name }],
            },
            link: {
              data: { fileId: doc.id },
              type: `dropbox`,
            },
          }),
        )
        onClose(payloads)
      },
    })

    useMountOnce(() => {
      choose({ select: "file" })
    })

    return <BlockingScreen />
  },
)
