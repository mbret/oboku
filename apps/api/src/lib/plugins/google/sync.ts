/**
 * 401 credentials error
 * [{"domain":"global","reason":"authError","message":"Invalid Credentials","locationType":"header","location":"Authorization"}]
 */
import { type drive_v3 } from "googleapis"
import type { SynchronizeAbleItem } from "src/lib/plugins/types"
import { createThrottler } from "src/lib/utils"
import { isDefined } from "class-validator"

export const generateResourceId = (driveId: string) => `drive-${driveId}`
export const extractIdFromResourceId = (resourceId: string) =>
  resourceId.replace(`drive-`, ``)

const isFolder = (
  file: NonNullable<drive_v3.Schema$FileList["files"]>[number],
) => file.mimeType === "application/vnd.google-apps.folder"

type TreeNode = drive_v3.Schema$File & { id: string; children: TreeNode[] }

function buildTree(
  items: (drive_v3.Schema$File & { id: string })[],
): TreeNode[] {
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

    if ((item.parents?.length ?? 0) === 0) {
      // This is a root level item
      roots.push(node)
    } else {
      // This has a parent, add it to parent's children
      const parents =
        item.parents
          ?.map((parentId) => itemMap.get(parentId))
          .filter(isDefined) ?? []

      if (parents.length > 0) {
        parents.forEach((parent) => {
          if (parent) {
            parent.children.push(node)
          }
        })
      } else {
        // Parent not found in the list, treat as root
        roots.push(node)
      }
    }
  })

  return roots
}

export const getSynchronizeAbleDataSourceFromItems = async ({
  items,
  drive,
}: {
  items: readonly string[]
  drive: drive_v3.Drive
}) => {
  const throttle = createThrottler(50)

  const getFileMetadata = throttle(async (fileId: string) => {
    const response = await drive.files.get({
      fileId,
      fields: "id, kind, name, mimeType, modifiedTime, parents, trashed",
      supportsAllDrives: true,
    })

    const file = response.data

    return file as drive_v3.Schema$File & { id: string }
  })

  const files = await Promise.all(items.map(getFileMetadata))
  const tree = buildTree(files)

  console.log(files, tree)

  const asSynchronizeAbleItem = (file: TreeNode): SynchronizeAbleItem => {
    if (isFolder(file)) {
      return {
        type: "folder",
        resourceId: generateResourceId(file.id || ""),
        items: file.children.map(asSynchronizeAbleItem),
        name: file.name || "",
        modifiedAt: file.modifiedTime || new Date().toISOString(),
      }
    }

    return {
      type: "file",
      resourceId: generateResourceId(file.id || ""),
      name: file.name || "",
      modifiedAt: file.modifiedTime || new Date().toISOString(),
    }
  }

  return {
    items: tree.map(asSynchronizeAbleItem),
  }
}
