import { useCallback } from "react"
import type { SynologyDriveBrowseItem } from "@oboku/synology"
import type { TreeNode } from "../../../common/FileTreeView"
import { browseSynologyDrive, type SynologyDriveSession } from "../client"
import { isSynologyDriveBrowseNodeId } from "./tree"

export const useLoadChildren = <TTreeNode extends TreeNode>({
  mapItems,
  onError,
  session,
}: {
  mapItems: (items: SynologyDriveBrowseItem[]) => TTreeNode[]
  onError?: (error: unknown) => void
  session: SynologyDriveSession | undefined
}) =>
  useCallback(
    async (nodeId: string): Promise<TTreeNode[]> => {
      if (!session || !isSynologyDriveBrowseNodeId(nodeId)) {
        return []
      }

      try {
        const response = await browseSynologyDrive({
          nodeId,
          session,
        })

        return mapItems(response.items)
      } catch (error) {
        if (!onError) {
          throw error
        }

        onError(error)

        return []
      }
    },
    [mapItems, onError, session],
  )
