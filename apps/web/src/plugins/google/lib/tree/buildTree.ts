import type { TreeItem, TreeNode } from "./TreeView"

export function buildTree(items: TreeItem[]): TreeNode[] {
  // Create a map for quick lookup of items by id
  const itemMap = new Map<string, TreeNode>()

  // Initialize all items as tree nodes with empty children arrays
  items.forEach((item) => {
    itemMap.set(item.id, {
      ...item,
      children: [],
    })
  })

  const roots: TreeNode[] = []

  // Build the tree structure by connecting parents and children
  items.forEach((item) => {
    const node = itemMap.get(item.id)

    if (!node) return

    if (!item.parentId || item.parentId === "root") {
      // This is a root level item
      roots.push(node)
    } else {
      // This has a parent, add it to parent's children
      const parent = itemMap.get(item.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        // Parent not found in the list, treat as root
        roots.push(node)
      }
    }
  })

  return roots
}
