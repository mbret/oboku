import {
  buildDriveItemUrl,
  getOneDriveItemKey,
  type GraphDriveItem,
  type OneDriveLinkData,
} from "@oboku/shared"
import type { SynchronizeAbleItem } from "src/features/plugins/types"
import { createThrottler } from "src/lib/utils"
import { fetchOneDriveJson } from "./graph"

type OneDriveSyncDriveItem = GraphDriveItem & {
  id: string
}

type TreeNode = OneDriveSyncDriveItem & {
  children: TreeNode[]
}

function isFolder(item: OneDriveSyncDriveItem) {
  return !!item.folder || !!item.package
}

function buildTree(items: OneDriveSyncDriveItem[]): TreeNode[] {
  const itemMap = new Map<string, TreeNode>()

  items.forEach((item) => {
    itemMap.set(
      getOneDriveItemKey({
        driveId: item.parentReference?.driveId ?? "",
        fileId: item.id,
      }),
      {
        ...item,
        children: [],
      },
    )
  })

  const roots: TreeNode[] = []

  items.forEach((item) => {
    const node = itemMap.get(
      getOneDriveItemKey({
        driveId: item.parentReference?.driveId ?? "",
        fileId: item.id,
      }),
    )

    if (!node) {
      return
    }

    const parentDriveId = item.parentReference?.driveId
    const parentId = item.parentReference?.id

    if (!parentDriveId || !parentId) {
      roots.push(node)
      return
    }

    const parent = itemMap.get(
      getOneDriveItemKey({
        driveId: parentDriveId,
        fileId: parentId,
      }),
    )

    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

function toSynchronizeAbleItem(
  item: TreeNode,
): SynchronizeAbleItem<"one-drive"> {
  const driveId = item.parentReference?.driveId

  if (!driveId) {
    throw new Error("OneDrive item is missing a drive id.")
  }

  if (isFolder(item)) {
    return {
      type: "folder",
      linkData: {
        driveId,
        fileId: item.id,
      },
      items: item.children.map(toSynchronizeAbleItem),
      name: item.name || "",
      modifiedAt: item.lastModifiedDateTime || new Date().toISOString(),
    }
  }

  return {
    type: "file",
    linkData: {
      driveId,
      fileId: item.id,
    },
    name: item.name || "",
    modifiedAt: item.lastModifiedDateTime || new Date().toISOString(),
  }
}

export async function getSynchronizeAbleDataSourceFromItems({
  accessToken,
  items,
}: {
  accessToken: string
  items: readonly OneDriveLinkData[]
}) {
  /**
   * OneDrive sync uses an explicit whitelist, not recursive folder expansion.
   *
   * We only fetch metadata for items that were explicitly granted and saved in
   * the datasource. A selected folder contributes its own node to the tree, but
   * its descendants only appear when those descendants are also present in
   * `items`.
   *
   * This matches the Google Drive permission model and keeps the cross-plugin
   * sync contract consistent: the plugin-specific builder shapes the saved
   * selection into a tree, but it does not discover additional children.
   */
  const throttle = createThrottler(50)

  const getFileMetadata = throttle(async (item: OneDriveLinkData) => {
    const response = await fetchOneDriveJson<OneDriveSyncDriveItem>(
      accessToken,
      `${buildDriveItemUrl(item.driveId, item.fileId)}?$select=id,name,lastModifiedDateTime,parentReference,file,folder,package`,
    )

    if (!response.id) {
      throw new Error("OneDrive item is missing an id.")
    }

    if (!response.parentReference?.driveId) {
      throw new Error("OneDrive item is missing a drive id.")
    }

    return response
  })

  const files = await Promise.all(items.map(getFileMetadata))
  const tree = buildTree(files)

  return {
    items: tree.map(toSynchronizeAbleItem),
  }
}
