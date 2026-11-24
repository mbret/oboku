import {
  isFileSupported,
  type WebdavDirectoryItemDto,
  type WebdavLinkData,
} from "@oboku/shared"
import { useCallback, useMemo } from "react"
import type { TreeNode } from "../../../../common/FileTreeView"
import { notifyError } from "../../../../notifications/toasts"
import type { WebdavBackedType } from "../constants"
import type { WebdavAuthResult } from "./ConnectorSelectionStep"
import type { UploadBookToAddPayload } from "../../../plugins/types"
import { AddBookFileBrowseStep } from "../../../../upload/AddBookFileBrowseStep"

export const sortItems = (items: ReadonlyArray<WebdavDirectoryItemDto>) =>
  [...items].sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === "directory" ? -1 : 1
    }
    return left.basename.localeCompare(right.basename)
  })

export function toTreeNodeList(
  items: ReadonlyArray<WebdavDirectoryItemDto>,
): TreeNode[] {
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
      etag: item.etag,
      children: [],
    }))
}

export type WebdavUploadBookToAddPayload<T extends WebdavBackedType> = {
  book: UploadBookToAddPayload["book"]
  link: { type: T; data: WebdavLinkData }
}

export function FileBrowseStep<T extends WebdavBackedType>({
  authResult,
  connectorType,
  headerSubtitle,
  onCancel,
  onClose,
  onGoBack,
}: {
  authResult: WebdavAuthResult
  connectorType: T
  headerSubtitle?: string
  onCancel: () => void
  onClose: (booksToAdd: ReadonlyArray<WebdavUploadBookToAddPayload<T>>) => void
  onGoBack: () => void
}) {
  const { connectorId, listDirectory } = authResult

  const initialItems = useMemo(
    function buildInitialItems() {
      return toTreeNodeList(authResult.items)
    },
    [authResult.items],
  )

  const onLoadChildren = useCallback(
    async function loadDirectoryChildren(nodeId: string) {
      try {
        const items = await listDirectory(nodeId)
        return toTreeNodeList(items)
      } catch (error) {
        notifyError(error)
        return []
      }
    },
    [listDirectory],
  )

  const handleAddBooks = (selectedFiles: TreeNode[]) => {
    const booksToAdd: WebdavUploadBookToAddPayload<T>[] = selectedFiles.map(
      function toBookToAdd(file) {
        return {
          book: {
            metadata: [{ title: file.label, type: "link" }],
          },
          link: {
            data: {
              connectorId,
              filePath: file.id,
              etag: file.etag,
            },
            type: connectorType,
          },
        }
      },
    )

    onClose(booksToAdd)
  }

  return (
    <AddBookFileBrowseStep
      initialItems={initialItems}
      onLoadChildren={onLoadChildren}
      headerSubtitle={
        headerSubtitle ?? `Connected with connector ${authResult.url}`
      }
      onCancel={onCancel}
      onBack={onGoBack}
      onAddBooks={handleAddBooks}
    />
  )
}
