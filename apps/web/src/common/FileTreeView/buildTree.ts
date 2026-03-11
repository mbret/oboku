import type { TreeItem, TreeNode } from "./types"

export function buildTree(items: TreeItem[]): TreeNode[] {
  const itemMap = new Map<string, TreeNode>()

  items.forEach((item) => {
    itemMap.set(item.id, {
      ...item,
      children: [],
    })
  })

  const roots: TreeNode[] = []

  items.forEach((item) => {
    const node = itemMap.get(item.id)
    if (!node) return

    if (!item.parentId || item.parentId === "root") {
      roots.push(node)
    } else {
      const parent = itemMap.get(item.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    }
  })

  return roots
}
