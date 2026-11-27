import { getFileNameFromUrl } from "@oboku/shared"
import { TYPE } from "./constants"
import type { SourcePlugin } from "../types"
import { WebAddressDialog } from "./WebAddressDialog"

export const UploadBookComponent: SourcePlugin<"URI">["UploadBookComponent"] =
  ({ onClose, title }) => (
    <WebAddressDialog
      title={title}
      onCancel={function cancelAddingBook() {
        onClose()
      }}
      onConfirm={function addBook(linkData) {
        onClose([
          {
            book: { title: getFileNameFromUrl(linkData.url) ?? "unknown" },
            link: { data: linkData, type: TYPE },
          },
        ])
      }}
    />
  )
