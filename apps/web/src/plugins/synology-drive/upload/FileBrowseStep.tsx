import {
  generateSynologyDriveResourceId,
  isFileSupported,
  PLUGIN_SYNOLOGY_DRIVE_TYPE,
} from "@oboku/shared"
import type {
  SynologyDriveBrowseItem,
  SynologyDriveBrowseNodeId,
} from "@oboku/synology"
import { memo, useMemo } from "react"
import { useMutation } from "@tanstack/react-query"
import type { TreeNode } from "../../../common/FileTreeView"
import { useConnector } from "../../../connectors/useConnector"
import { useNotifications } from "../../../notifications/useNofitications"
import type { UploadBookToAddPayload } from "../../types"
import type { SynologyAuthResult } from "./ConnectorSelectionStep"
import { clearSynologyDriveSession } from "../auth/auth"
import { browseSynologyDrive, type SynologyDriveSession } from "../client"
import { AddBookFileBrowseStep } from "../../../upload/AddBookFileBrowseStep"

type SynologyTreeNode = TreeNode & { fileId?: string; path?: string }

function toTreeNodeList(items: SynologyDriveBrowseItem[]): SynologyTreeNode[] {
  return items
    .filter(
      (item) => item.type === "folder" || isFileSupported({ name: item.name }),
    )
    .map((item) => ({
      id: item.id,
      label: item.name,
      type: item.type,
      children: [],
      fileId: item.fileId,
      path: item.path,
    }))
}

export const FileBrowseStep = memo(
  ({
    onAccountChange,
    onClose,
    authResult,
  }: {
    authResult: SynologyAuthResult
    onAccountChange: () => void
    onClose: (booksToAdd?: ReadonlyArray<UploadBookToAddPayload>) => void
  }) => {
    const { notifyError } = useNotifications()
    const { session, connectorId } = authResult
    const { data: connector } = useConnector({
      id: connectorId,
      type: "synology-drive",
    })
    const url = session.auth.baseUrl ?? connector?.url ?? ""

    const browseMutation = useMutation({
      mutationFn: async ({
        nodeId,
        session,
      }: {
        nodeId?: SynologyDriveBrowseNodeId
        session: SynologyDriveSession
      }) => {
        const response = await browseSynologyDrive({ nodeId, session })
        return response.items
      },
    })

    const initialItems = useMemo(
      () => toTreeNodeList(authResult.items),
      [authResult.items],
    )

    const onLoadChildren = useMemo(() => {
      if (!session) return async () => [] as TreeNode[]
      return async (nodeId: string): Promise<TreeNode[]> => {
        try {
          const items = await browseMutation.mutateAsync({
            nodeId: nodeId as SynologyDriveBrowseNodeId,
            session,
          })
          return toTreeNodeList(items)
        } catch (error) {
          notifyError(
            error instanceof Error
              ? error
              : new Error(
                  "Synology Drive session may have expired. Try again or sign in again.",
                ),
          )
          return []
        }
      }
    }, [session, browseMutation, notifyError])

    const handleAddBooks = (selectedFiles: TreeNode[]) => {
      if (!url) {
        notifyError(new Error("Synology Drive URL is not available anymore."))
        return
      }
      const booksToAdd: UploadBookToAddPayload[] = []
      for (const file of selectedFiles as SynologyTreeNode[]) {
        if (!file.fileId) {
          notifyError(new Error("Missing Synology Drive file id"))
          return
        }
        booksToAdd.push({
          book: {
            metadata: [{ type: "link", title: file.label }],
          },
          link: {
            data: {
              connectorId,
            },
            resourceId: generateSynologyDriveResourceId({
              fileId: file.fileId,
            }),
            type: PLUGIN_SYNOLOGY_DRIVE_TYPE,
          },
        })
      }
      onClose(booksToAdd)
    }

    const handleChangeAccount = () => {
      clearSynologyDriveSession()
      onAccountChange()
    }

    return (
      <AddBookFileBrowseStep
        initialItems={initialItems}
        onLoadChildren={onLoadChildren}
        headerSubtitle={url}
        onCancel={() => onClose()}
        onBack={handleChangeAccount}
        onAddBooks={handleAddBooks}
      />
    )
  },
)
