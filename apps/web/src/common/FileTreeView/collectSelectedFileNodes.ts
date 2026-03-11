import type { TreeNode } from "./types"

/**
 * Collects tree nodes that are files and whose id is in selectedIds.
 * Used by add-book flows to resolve selected ids to full nodes for payload building.
 */
export function collectSelectedFileNodes(
  items: TreeNode[],
  selectedIds: string[],
): TreeNode[] {
  const set = new Set(selectedIds)
  const out: TreeNode[] = []
  for (const item of items) {
    if (item.type === "file" && set.has(item.id)) out.push(item)
    if (item.children?.length) {
      out.push(...collectSelectedFileNodes(item.children, selectedIds))
    }
  }
  return out
}
