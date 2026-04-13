import { getOneDriveItemKey, type OneDriveLinkData } from "@oboku/shared"
import { memo, useCallback, useMemo, useState } from "react"
import {
  TreeView as FileTreeView,
  buildTree,
  type TreeItem,
  type TreeNode,
} from "../../../common/FileTreeView"
import { TreeActionsSection } from "../../common/TreeActionsSection"
import type { OneDriveDriveItemSummary } from "../graph"
import type { ResolvedOneDriveDataSourceItem } from "./useDataSourceItem"

function isFolder(item: OneDriveDriveItemSummary | undefined) {
  return !!item?.folder || !!item?.package
}

function getOneDriveTreeStateItemId({
  item,
  driveItem,
}: {
  item: OneDriveLinkData
  driveItem: ResolvedOneDriveDataSourceItem | undefined
}) {
  return driveItem?.treeItemId ?? getOneDriveItemKey(item)
}

function buildOneDriveTreeState({
  items,
  driveItems,
}: {
  items: readonly OneDriveLinkData[]
  driveItems: ReadonlyArray<ResolvedOneDriveDataSourceItem | undefined>
}) {
  const treeItemIds = items.map(function mapItemToTreeItemId(item, index) {
    return getOneDriveTreeStateItemId({
      item,
      driveItem: driveItems[index],
    })
  })
  const availableTreeItemIds = new Set(treeItemIds)
  const nodesById = new Map<string, TreeItem>()

  function upsertTreeItem(treeItem: TreeItem) {
    nodesById.set(treeItem.id, treeItem)
  }

  items.forEach(function addUnresolvedTreeItem(item, index) {
    const driveItem = driveItems[index]

    if (driveItem) {
      return
    }

    upsertTreeItem({
      id: treeItemIds[index] ?? getOneDriveItemKey(item),
      label: `${item.driveId}/${item.fileId}`,
      type: "file",
      canSelect: true,
    })
  })

  items.forEach(function addResolvedTreeItem(item, index) {
    const driveItem = driveItems[index]

    if (!driveItem) {
      return
    }

    upsertTreeItem({
      id: driveItem.treeItemId,
      parentId:
        driveItem.parentTreeItemId &&
        availableTreeItemIds.has(driveItem.parentTreeItemId)
          ? driveItem.parentTreeItemId
          : undefined,
      type: isFolder(driveItem.metadata) ? "folder" : "file",
      label: driveItem.metadata.name || `${item.driveId}/${item.fileId}`,
      fileType: driveItem.metadata.file?.mimeType,
      canSelect: true,
    })
  })

  if (nodesById.size === 0) {
    return {
      treeItemIds,
      treeViewItems: [] as TreeNode[],
    }
  }

  return {
    treeItemIds,
    treeViewItems: buildTree([...nodesById.values()]),
  }
}

export const OneDriveTreeView = memo(function OneDriveTreeView({
  items,
  driveItems,
  onItemsChange,
}: {
  items: readonly OneDriveLinkData[]
  driveItems: ReadonlyArray<ResolvedOneDriveDataSourceItem | undefined>
  onItemsChange: (items: OneDriveLinkData[]) => void
}) {
  const [selectedTreeItemIds, setSelectedTreeItemIds] = useState<string[]>([])
  const { treeItemIds, treeViewItems } = useMemo(
    () =>
      buildOneDriveTreeState({
        items,
        driveItems,
      }),
    [driveItems, items],
  )
  const handleDeleteSelectedItems = useCallback(() => {
    setSelectedTreeItemIds([])
    onItemsChange(
      items.filter(function isUnselectedTreeItem(_item, index) {
        return !selectedTreeItemIds.includes(treeItemIds[index] ?? "")
      }),
    )
  }, [items, onItemsChange, selectedTreeItemIds, treeItemIds])

  return (
    <TreeActionsSection
      onDeleteSelectedItems={handleDeleteSelectedItems}
      selectedItemsCount={selectedTreeItemIds.length}
    >
      <FileTreeView
        checkboxSelection
        items={treeViewItems}
        isItemSelectionDisabled={(item) => !(item.canSelect ?? true)}
        selectedItems={selectedTreeItemIds}
        onSelectedItemsChange={(_event, nextSelectedItems) =>
          setSelectedTreeItemIds(nextSelectedItems)
        }
      />
    </TreeActionsSection>
  )
})
