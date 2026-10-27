import {
  isFileSupported,
  ObokuErrorCode,
  type WebdavLinkData,
} from "@oboku/shared"
import type { FileStat } from "webdav"
import { useCallback, useMemo } from "react"
import type { TreeNode } from "../../../../common/FileTreeView"
import { notifyError } from "../../../../notifications/toasts"
import type { WebdavBackedType } from "../constants"
import type { WebdavAuthResult } from "./ConnectorSelectionStep"
import type { UploadBookToAddPayload } from "../../../../plugins/types"
import { AddBookFileBrowseStep } from "../../../../upload/AddBookFileBrowseStep"

export const sortItems = (items: FileStat[]) =>
  [...items].sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === "directory" ? -1 : 1
    }
    return left.basename.localeCompare(right.basename)
  })

export function toTreeNodeList(items: FileStat[]): TreeNode[] {
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
      etag: item.etag ?? undefined,
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
  const { client, connectorId } = authResult

  const initialItems = useMemo(
    function buildInitialItems() {
      return toTreeNodeList(authResult.items)
    },
    [authResult.items],
  )

  const onLoadChildren = useCallback(
    async function loadDirectoryChildren(nodeId: string) {
      try {
        const items = await client.getDirectoryContents(nodeId)
        return toTreeNodeList(items)
      } catch (_e) {
        notifyError(ObokuErrorCode.ERROR_DATASOURCE_UNKNOWN)
        return []
      }
    },
    [client],
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
