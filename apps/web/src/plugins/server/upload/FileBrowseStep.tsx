import { generateServerResourceId } from "@oboku/shared"
import { memo } from "react"
import type { TreeNode } from "../../../common/FileTreeView"
import { TYPE } from "../constants"
import type { ServerAuthResult } from "./ConnectorSelectionStep"
import type { UploadBookToAddPayload } from "../../types"
import { WebdavAddBookFileBrowseStep } from "../../webdav/upload/FileBrowseStep"

export const FileBrowseStep = memo(
  ({
    authResult,
    onClose,
    onGoBack,
  }: {
    authResult: ServerAuthResult
    onClose: (
      booksToAdd?: ReadonlyArray<UploadBookToAddPayload<"server">>,
    ) => void
    onGoBack: () => void
  }) => {
    const { connectorId } = authResult

    const handleAddBooks = (selectedFiles: TreeNode[]) => {
      const booksToAdd: UploadBookToAddPayload<"server">[] = selectedFiles.map(
        (file) => ({
          book: {
            metadata: [{ title: file.label, type: "link" }],
          },
          link: {
            data: {
              connectorId,
              etag: file.etag,
            },
            resourceId: generateServerResourceId({
              filePath: file.id,
            }),
            type: TYPE,
          },
        }),
      )

      onClose(booksToAdd)
    }

    return (
      <WebdavAddBookFileBrowseStep
        client={authResult.client}
        initialFileStats={authResult.items}
        headerSubtitle="Connected to oboku server"
        onAddBooks={handleAddBooks}
        onCancel={() => onClose()}
        onGoBack={onGoBack}
      />
    )
  },
)
