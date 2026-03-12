import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import type { SynologyDriveBrowseNodeId } from "@oboku/synology"
import {
  browseSynologyDrive,
  getSynologyDriveBrowseItem,
  type SynologyDriveSession,
} from "../client"
import {
  getAncestorPaths,
  getRootNodeIdFromPath,
  normalizeSynologyPath,
  toTreeNodeList,
  type SynologyTreeNode,
  updateTreeNodeChildren,
} from "./tree"
import { useLoadChildren } from "./useLoadChildren"

export const useSelectionTreeData = ({
  connectorId,
  prefetchedSelectedItemIds,
  session,
}: {
  connectorId: string
  prefetchedSelectedItemIds: string[]
  session: SynologyDriveSession | undefined
}) => {
  const rootItemsQuery = useQuery({
    queryKey: [
      "synology-drive",
      "datasource-root-items",
      connectorId,
      session?.sid,
    ],
    queryFn: async () => {
      if (!session) {
        throw new Error("No Synology Drive session")
      }

      return await browseSynologyDrive({
        session,
      })
    },
    enabled: !!session,
    retry: false,
  })

  const initialItems = useMemo(
    () => toTreeNodeList(rootItemsQuery.data?.items ?? []),
    [rootItemsQuery.data?.items],
  )

  const prefetchedSelectionTreeQuery = useQuery({
    queryKey: [
      "synology-drive",
      "datasource-selected-items-tree",
      connectorId,
      session?.sid,
      ...prefetchedSelectedItemIds,
    ],
    queryFn: async () => {
      if (!session) {
        throw new Error("No Synology Drive session")
      }

      let nextTree = initialItems
      const expandedItems = new Set<string>()
      const childrenByNodeId = new Map<string, SynologyTreeNode[]>()

      const ensureChildrenLoaded = async (
        nodeId: SynologyDriveBrowseNodeId,
      ) => {
        const cachedChildren = childrenByNodeId.get(nodeId)

        if (cachedChildren) {
          return cachedChildren
        }

        const response = await browseSynologyDrive({
          nodeId,
          session,
        })
        const children = toTreeNodeList(response.items)

        childrenByNodeId.set(nodeId, children)
        nextTree = updateTreeNodeChildren(nextTree, nodeId, children)

        return children
      }

      const selectedItems = await Promise.all(
        prefetchedSelectedItemIds.map((fileId) =>
          getSynologyDriveBrowseItem({
            fileId,
            session,
          }).catch(() => undefined),
        ),
      )

      for (const item of selectedItems) {
        const itemPath = item?.path ? normalizeSynologyPath(item.path) : ""
        const rootNodeId = itemPath
          ? getRootNodeIdFromPath(itemPath)
          : undefined

        if (!rootNodeId) {
          continue
        }

        expandedItems.add(rootNodeId)
        let currentNodeId = rootNodeId

        for (const ancestorPath of getAncestorPaths(itemPath, rootNodeId)) {
          const children = await ensureChildrenLoaded(currentNodeId)
          const nextNode = children.find(
            (child) =>
              child.type === "folder" &&
              normalizeSynologyPath(child.path ?? "") === ancestorPath,
          )

          if (!nextNode) {
            break
          }

          currentNodeId = nextNode.id
          expandedItems.add(currentNodeId)
        }
      }

      return {
        expandedItems: Array.from(expandedItems),
        tree: nextTree,
      }
    },
    enabled:
      !!session &&
      initialItems.length > 0 &&
      prefetchedSelectedItemIds.length > 0,
    retry: false,
  })

  const onLoadChildren = useLoadChildren({
    mapItems: toTreeNodeList,
    session,
  })

  const treeItems = useMemo(
    () => prefetchedSelectionTreeQuery.data?.tree ?? initialItems,
    [initialItems, prefetchedSelectionTreeQuery.data?.tree],
  )

  const initialExpandedItems = useMemo(
    () => prefetchedSelectionTreeQuery.data?.expandedItems ?? [],
    [prefetchedSelectionTreeQuery.data?.expandedItems],
  )

  const isTreeLoading =
    !!session && (rootItemsQuery.isPending || rootItemsQuery.isFetching)
  const isSelectedItemsPrefetchLoading =
    !!session &&
    prefetchedSelectedItemIds.length > 0 &&
    prefetchedSelectionTreeQuery.isPending
  const treeError =
    rootItemsQuery.error instanceof Error
      ? rootItemsQuery.error
      : prefetchedSelectionTreeQuery.error instanceof Error
        ? prefetchedSelectionTreeQuery.error
        : undefined

  return {
    initialExpandedItems,
    isSelectedItemsPrefetchLoading,
    isTreeLoading,
    onLoadChildren,
    treeError,
    treeItems,
  }
}
