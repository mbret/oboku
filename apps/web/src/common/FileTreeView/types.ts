export type TreeItem = {
  id: string
  parentId?: string
  type?: "file" | "folder"
  label: string
  fileType?: string
  canSelect?: boolean
  etag?: string
  /** Set by lazy tree when loading children for this node */
  isLoading?: boolean
}

export type TreeNode = TreeItem & {
  children: TreeNode[]
}
