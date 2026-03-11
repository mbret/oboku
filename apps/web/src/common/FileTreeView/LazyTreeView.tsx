import { isFileSupported } from "@oboku/shared"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { SyntheticEvent } from "react"
import { TreeView } from "./TreeView"
import type { TreeNode } from "./types"

/** Id suffix for placeholder child added so MUI shows expand arrow on empty folders */
const PLACEHOLDER_SUFFIX = "__placeholder"

function isPlaceholderId(id: string): boolean {
  return id.endsWith(PLACEHOLDER_SUFFIX)
}

/**
 * MUI only treats an item as expandable when it has at least one child.
 * Ensure every folder has a placeholder child so the arrow appears and expand works.
 */
function ensureFolderExpandable(items: TreeNode[]): TreeNode[] {
  return items.map((item) => {
    if (item.type === "folder" && (item.children?.length ?? 0) === 0) {
      return {
        ...item,
        children: [
          {
            id: `${item.id}${PLACEHOLDER_SUFFIX}`,
            label: "",
            type: "file",
            children: [],
          },
        ],
      }
    }
    if (item.children?.length) {
      return {
        ...item,
        children: ensureFolderExpandable(item.children),
      }
    }
    return item
  })
}

/** True if the folder has no real children yet (only placeholder or none) */
function needsLoad(node: TreeNode): boolean {
  if (node.type !== "folder" || node.isLoading) return false
  const c = node.children ?? []
  if (c.length === 0) return true
  if (c.length === 1 && isPlaceholderId(c[0]?.id ?? "")) return true
  return false
}

function updateNode(
  items: TreeNode[],
  nodeId: string,
  updater: (node: TreeNode) => TreeNode,
): TreeNode[] {
  return items.map((item) => {
    if (item.id === nodeId) return updater(item)
    if (item.children?.length) {
      return {
        ...item,
        children: updateNode(item.children, nodeId, updater),
      }
    }
    return item
  })
}

function findNode(items: TreeNode[], nodeId: string): TreeNode | undefined {
  for (const item of items) {
    if (item.id === nodeId) return item
    if (item.children?.length) {
      const child = findNode(item.children, nodeId)
      if (child) return child
    }
  }
  return undefined
}

export type LazyTreeViewProps = {
  /** Initial root-level items (e.g. from first listing). */
  initialItems: TreeNode[]
  /** Branches to expand when the tree is initialized/reset. */
  initialExpandedItems?: string[]
  /** Load children for a folder. Returned nodes are merged into the tree. */
  onLoadChildren: (nodeId: string) => Promise<TreeNode[]>
  /** Called whenever the tree is updated (so parent can collect selected nodes). */
  onTreeChange?: (tree: TreeNode[]) => void
  /** Controlled selected item ids (for multi-select). */
  selectedItems?: string[]
  /** Called when selection changes. */
  onSelectedItemsChange?: (
    event: SyntheticEvent | null,
    itemIds: string[],
  ) => void
  isItemSelectionDisabled?: (item: TreeNode) => boolean
}

/**
 * Lazy-loading tree using the shared MUI TreeView. Keeps tree state and fetches
 * children on expand; passes the tree to TreeView (RichTreeView) and notifies
 * the parent via onTreeChange so selection can be resolved to full nodes.
 */
export const LazyTreeView = ({
  initialItems,
  initialExpandedItems = [],
  onLoadChildren,
  onTreeChange,
  selectedItems = [],
  onSelectedItemsChange,
  isItemSelectionDisabled: isItemSelectionDisabledProp,
}: LazyTreeViewProps) => {
  const [tree, setTree] = useState<TreeNode[]>(() =>
    ensureFolderExpandable(initialItems),
  )
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const expandedRef = useRef<string[]>([])
  const treeRef = useRef<TreeNode[]>(ensureFolderExpandable(initialItems))
  const onTreeChangeRef = useRef(onTreeChange)

  useEffect(() => {
    onTreeChangeRef.current = onTreeChange
  }, [onTreeChange])

  useEffect(() => {
    const nextTree = ensureFolderExpandable(initialItems)

    setTree(nextTree)
    setExpandedItems(initialExpandedItems)
    expandedRef.current = initialExpandedItems
    treeRef.current = nextTree
  }, [initialExpandedItems, initialItems])

  useEffect(() => {
    treeRef.current = tree
    onTreeChangeRef.current?.(tree)
  }, [tree])

  const loadChildrenIfNeeded = useCallback(
    async (nodeId: string) => {
      if (isPlaceholderId(nodeId)) return
      const node = findNode(treeRef.current, nodeId)
      if (!node || !needsLoad(node)) return

      setTree((prev) =>
        updateNode(prev, nodeId, (n) => ({ ...n, isLoading: true })),
      )

      try {
        const children = await onLoadChildren(nodeId)
        const childrenWithExpandableFolders = ensureFolderExpandable(children)
        setTree((prev) =>
          updateNode(prev, nodeId, (n) => ({
            ...n,
            children: childrenWithExpandableFolders,
            isLoading: false,
          })),
        )
      } catch {
        setTree((prev) =>
          updateNode(prev, nodeId, (n) => ({ ...n, isLoading: false })),
        )
      }
    },
    [onLoadChildren],
  )

  const handleExpandedItemsChange = useCallback(
    (_event: SyntheticEvent | null, itemIds: string[]) => {
      const prev = expandedRef.current
      setExpandedItems(itemIds)
      expandedRef.current = itemIds
      const added = itemIds.filter((id) => !prev.includes(id))
      added.forEach((id) => void loadChildrenIfNeeded(id))
    },
    [loadChildrenIfNeeded],
  )

  useEffect(() => {
    expandedItems.forEach((itemId) => {
      void loadChildrenIfNeeded(itemId)
    })
  }, [expandedItems, loadChildrenIfNeeded])

  const isItemSelectionDisabled = useMemo(() => {
    if (isItemSelectionDisabledProp) {
      return isItemSelectionDisabledProp
    }

    return (item: TreeNode) =>
      isPlaceholderId(item.id) ||
      item.type === "folder" ||
      (item.type === "file" &&
        !isFileSupported({ name: item.label, mimeType: item.fileType }))
  }, [isItemSelectionDisabledProp])

  return (
    <TreeView
      items={tree}
      expandedItems={expandedItems}
      onExpandedItemsChange={handleExpandedItemsChange}
      selectedItems={selectedItems}
      onSelectedItemsChange={onSelectedItemsChange}
      isItemSelectionDisabled={isItemSelectionDisabled}
      checkboxSelection
      multiSelect
    />
  )
}
