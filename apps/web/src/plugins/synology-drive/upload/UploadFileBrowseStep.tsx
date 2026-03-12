import {
  generateSynologyDriveResourceId,
  PLUGIN_SYNOLOGY_DRIVE_TYPE,
} from "@oboku/shared"
import { memo, useMemo } from "react"
import { useConnector } from "../../../connectors/useConnector"
import { useNotifications } from "../../../notifications/useNofitications"
import { AddBookFileBrowseStep } from "../../../upload/AddBookFileBrowseStep"
import type { UploadBookToAddPayload } from "../../types"
import { clearSynologyDriveSession } from "../auth/auth"
import type { SynologyAuthResult } from "./ConnectorSelectionStep"
import { useLoadChildren } from "../browsing/useLoadChildren"
import {
  isUploadBrowsableItem,
  toTreeNodeList,
  type SynologyTreeNode,
} from "../browsing/tree"
import type { TreeNode } from "../../../common/FileTreeView"

export const UploadFileBrowseStep = memo(
  ({
    authResult,
    onAccountChange,
    onClose,
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
    const initialItems = useMemo(
      () =>
        toTreeNodeList(authResult.items, {
          filterItem: isUploadBrowsableItem,
        }),
      [authResult.items],
    )
    const onLoadChildren = useLoadChildren({
      mapItems: (items) =>
        toTreeNodeList(items, {
          filterItem: isUploadBrowsableItem,
        }),
      onError: (error) => {
        notifyError(
          error instanceof Error
            ? error
            : new Error(
                "Synology Drive session may have expired. Try again or sign in again.",
              ),
        )
      },
      session,
    })

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
        headerSubtitle={url}
        initialItems={initialItems}
        onAddBooks={handleAddBooks}
        onBack={handleChangeAccount}
        onCancel={() => onClose()}
        onLoadChildren={onLoadChildren}
      />
    )
  },
)
