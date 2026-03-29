import { isFileSupported, ObokuErrorCode } from "@oboku/shared"
import type { FileStat, WebDAVClient } from "webdav"
import { memo, useMemo } from "react"
import type { TreeNode } from "../../../common/FileTreeView"
import { useConnector } from "../../../connectors/useConnector"
import { useNotifications } from "../../../notifications/useNofitications"
import { TYPE } from "../constants"
import type { WebdavAuthResult } from "./ConnectorSelectionStep"
import type { UploadBookToAddPayload } from "../../types"
import { AddBookFileBrowseStep } from "../../../upload/AddBookFileBrowseStep"

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

/**
 * Shared file-browse step for plugins backed by a WebDAV client.
 * Owns tree data loading (toTreeNodeList, onLoadChildren); the caller
 * supplies plugin-specific payload building via onAddBooks.
 */
export const WebdavAddBookFileBrowseStep = memo(
  function WebdavAddBookFileBrowseStep({
    client,
    initialFileStats,
    headerSubtitle,
    onAddBooks,
    onCancel,
    onGoBack,
  }: {
    client: WebDAVClient
    initialFileStats: FileStat[]
    headerSubtitle: string
    onAddBooks: (selectedFiles: TreeNode[]) => void
    onCancel: () => void
    onGoBack: () => void
  }) {
    const { notifyError } = useNotifications()

    const initialItems = useMemo(
      () => toTreeNodeList(initialFileStats),
      [initialFileStats],
    )

    const onLoadChildren = useMemo(() => {
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

    return (
      <AddBookFileBrowseStep
        initialItems={initialItems}
        onLoadChildren={onLoadChildren}
        headerSubtitle={headerSubtitle}
        onCancel={onCancel}
        onBack={onGoBack}
        onAddBooks={onAddBooks}
      />
    )
  },
)

export const FileBrowseStep = memo(
  ({
    authResult,
    onClose,
    onGoBack,
  }: {
    authResult: WebdavAuthResult
    onClose: (
      booksToAdd?: ReadonlyArray<UploadBookToAddPayload<"webdav">>,
    ) => void
    onGoBack: () => void
  }) => {
    const { connectorId } = authResult
    const { data: connector } = useConnector({
      id: connectorId,
      type: "webdav",
    })
    const connectorUrl = connector?.url ?? ""

    const handleAddBooks = (selectedFiles: TreeNode[]) => {
      const booksToAdd: UploadBookToAddPayload<"webdav">[] = selectedFiles.map(
        (file) => ({
          book: {
            metadata: [{ title: file.label, type: "link" }],
          },
          link: {
            data: {
              connectorId,
              filePath: file.id,
              etag: file.etag,
            },
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
        headerSubtitle={`Connected with connector ${connectorUrl}`}
        onAddBooks={handleAddBooks}
        onCancel={() => onClose()}
        onGoBack={onGoBack}
      />
    )
  },
)
