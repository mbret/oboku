import { isFileSupported } from "@oboku/shared"
import type {
  SynologyDriveBrowseItem,
  SynologyDriveBrowseNodeId,
} from "@oboku/synology"
import type { TreeNode } from "../../../common/FileTreeView"

export type SynologyTreeNode = Omit<TreeNode, "children" | "id"> & {
  children: SynologyTreeNode[]
  fileId?: string
  id: SynologyDriveBrowseNodeId
  path?: string
}

export const isUploadBrowsableItem = (item: SynologyDriveBrowseItem) =>
  item.type === "folder" || isFileSupported({ name: item.name })

export const toTreeNodeList = (
  items: SynologyDriveBrowseItem[],
  options?: {
    filterItem?: (item: SynologyDriveBrowseItem) => boolean
  },
): SynologyTreeNode[] =>
  items
    .filter((item) => options?.filterItem?.(item) ?? true)
    .map((item) => ({
      children: [],
      fileId: item.fileId,
      id: item.id,
      label: item.name,
      path: item.path,
      type: item.type,
    }))

export const collectSelectedNodes = (
  items: SynologyTreeNode[],
  selectedIds: ReadonlySet<string>,
  hasSelectedAncestor = false,
): SynologyTreeNode[] => {
  return items.flatMap((item) => {
    const isSelected = selectedIds.has(item.id) && !!item.fileId
    const shouldInclude = isSelected && !hasSelectedAncestor

    return [
      ...(shouldInclude ? [item] : []),
      ...collectSelectedNodes(
        item.children,
        selectedIds,
        hasSelectedAncestor || isSelected,
      ),
    ]
  })
}

export const countSelectedNodesByType = (items: SynologyTreeNode[]) =>
  items.reduce(
    (acc, item) => ({
      files: acc.files + (item.type === "file" ? 1 : 0),
      folders: acc.folders + (item.type === "folder" ? 1 : 0),
    }),
    { files: 0, folders: 0 },
  )

export const normalizeSynologyPath = (path: string) => path.replace(/\/+$/, "")

export const getRootNodeIdFromPath = (
  path: string,
): SynologyDriveBrowseNodeId | undefined => {
  if (path.startsWith("/mydrive")) {
    return "root:my-drive"
  }

  if (path.startsWith("/")) {
    return "root:team-folders"
  }

  return undefined
}

export const getAncestorPaths = (
  path: string,
  rootNodeId: SynologyDriveBrowseNodeId,
) => {
  const parts = normalizeSynologyPath(path).split("/").filter(Boolean)

  if (rootNodeId === "root:my-drive") {
    const ancestorParts = parts.slice(1, -1)
    let currentPath = "/mydrive"

    return ancestorParts.map((part) => {
      currentPath = `${currentPath}/${part}`

      return currentPath
    })
  }

  let currentPath = ""

  return parts.slice(0, -1).map((part) => {
    currentPath = `${currentPath}/${part}`

    return currentPath
  })
}

export const isSynologyDriveBrowseNodeId = (
  nodeId: string,
): nodeId is SynologyDriveBrowseNodeId =>
  nodeId.startsWith("root:") ||
  nodeId.startsWith("folder:") ||
  nodeId.startsWith("file:")

export const updateTreeNodeChildren = (
  items: SynologyTreeNode[],
  nodeId: string,
  children: SynologyTreeNode[],
): SynologyTreeNode[] =>
  items.map((item) => {
    if (item.id === nodeId) {
      return {
        ...item,
        children,
      }
    }

    if (item.children.length === 0) {
      return item
    }

    return {
      ...item,
      children: updateTreeNodeChildren(item.children, nodeId, children),
    }
  })

export const toSelectedTreeItemIds = (selectedItemIds: readonly string[]) =>
  Array.from(
    new Set(
      selectedItemIds.flatMap((itemId) => [
        `file:${itemId}`,
        `folder:${itemId}`,
      ]),
    ),
  )
