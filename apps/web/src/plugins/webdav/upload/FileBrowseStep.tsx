import {
  generateWebdavResourceId,
  isFileSupported,
  ObokuErrorCode,
} from "@oboku/shared"
import type { FileStat } from "webdav"
import { memo, useMemo } from "react"
import type { TreeNode } from "../../../common/FileTreeView"
import { useConnector } from "../../../connectors/useConnector"
import { useNotifications } from "../../../notifications/useNofitications"
import { TYPE } from "../constants"
import type { WebdavAuthResult } from "./ConnectorSelectionStep"
import type { UploadBookToAddPayload } from "../../types"
import { AddBookFileBrowseStep } from "../../../upload/AddBookFileBrowseStep"

const sortItems = (items: FileStat[]) =>
  [...items].sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === "directory" ? -1 : 1
    }
    return left.basename.localeCompare(right.basename)
  })

function toTreeNodeList(items: FileStat[]): TreeNode[] {
  return sortItems(items)
    .filter(
      (item) =>
        item.type === "directory" ||
        isFileSupported({ name: item.basename, mimeType: item.mime }),
    )
    .map((item) => ({
      id: item.filename,
      label: item.basename,
      type: item.type === "directory" ? "folder" : "file",
      fileType: item.mime,
      children: [],
    }))
}

export const FileBrowseStep = memo(
  ({
    authResult,
    onClose,
    onGoBack,
  }: {
    authResult: WebdavAuthResult
    onClose: (booksToAdd?: ReadonlyArray<UploadBookToAddPayload>) => void
    onGoBack: () => void
  }) => {
    const { notifyError } = useNotifications()
    const { client, connectorId } = authResult
    const { data: connector } = useConnector({
      id: connectorId,
      type: "webdav",
    })
    const connectorUrl = connector?.url ?? ""

    const initialItems = useMemo(
      () => toTreeNodeList(authResult.items),
      [authResult.items],
    )

    const onLoadChildren = useMemo(() => {
      if (!client) return async () => [] as TreeNode[]
      return async (nodeId: string): Promise<TreeNode[]> => {
        try {
          const items = await client.getDirectoryContents(nodeId)
          return toTreeNodeList(items)
        } catch (_e) {
          notifyError(ObokuErrorCode.ERROR_DATASOURCE_UNKNOWN)
          return []
        }
      }
    }, [client, notifyError])

    const handleAddBooks = (selectedFiles: TreeNode[]) => {
      const booksToAdd: UploadBookToAddPayload[] = selectedFiles.map(
        (file) => ({
          book: {
            metadata: [{ title: file.label, type: "link" }],
          },
          link: {
            data: { connectorId },
            resourceId: generateWebdavResourceId({
              filename: file.id,
            }),
            type: TYPE,
          },
        }),
      )

      onClose(booksToAdd)
    }

    return (
      <AddBookFileBrowseStep
        initialItems={initialItems}
        onLoadChildren={onLoadChildren}
        headerSubtitle={`Connected with connector ${connectorUrl}`}
        onCancel={() => onClose()}
        onBack={onGoBack}
        onAddBooks={handleAddBooks}
      />
    )
  },
)
