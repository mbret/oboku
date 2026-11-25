import { getOneDriveItemKey, type OneDriveLinkData } from "@oboku/shared"
import { memo, useCallback, useMemo, useState } from "react"
import {
  TreeView as FileTreeView,
  buildTree,
  type TreeItem,
  type TreeNode,
} from "../../../../common/FileTreeView"
import { TreeActionsSection } from "../../../plugins/common/TreeActionsSection"
import type { OneDriveDriveItemSummary } from "../graph"
import type { ResolvedOneDriveLibrarySyncLocation } from "./useLibrarySyncLocation"

function isFolder(item: OneDriveDriveItemSummary | undefined) {
  return !!item?.folder || !!item?.package
}

function getOneDriveTreeStateItemId({
  location,
  driveItem,
}: {
  location: OneDriveLinkData
  driveItem: ResolvedOneDriveLibrarySyncLocation | undefined
}) {
  return driveItem?.treeItemId ?? getOneDriveItemKey(location)
}

function buildOneDriveTreeState({
  locations,
  driveItems,
}: {
  locations: readonly OneDriveLinkData[]
  driveItems: ReadonlyArray<ResolvedOneDriveLibrarySyncLocation | undefined>
}) {
  const treeItemIds = locations.map(
    function mapLocationToTreeItemId(location, index) {
      return getOneDriveTreeStateItemId({
        location,
        driveItem: driveItems[index],
      })
    },
  )
  const availableTreeItemIds = new Set(treeItemIds)
  const nodesById = new Map<string, TreeItem>()

  function upsertTreeItem(treeItem: TreeItem) {
    nodesById.set(treeItem.id, treeItem)
  }

  locations.forEach(function addUnresolvedTreeItem(location, index) {
    const driveItem = driveItems[index]

    if (driveItem) {
      return
    }

    upsertTreeItem({
      id: treeItemIds[index] ?? getOneDriveItemKey(location),
      label: `${location.driveId}/${location.fileId}`,
      type: "file",
      canSelect: true,
    })
  })

  locations.forEach(function addResolvedTreeItem(location, index) {
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
      label:
        driveItem.metadata.name || `${location.driveId}/${location.fileId}`,
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
  locations,
  driveItems,
  onLocationsChange,
}: {
  locations: readonly OneDriveLinkData[]
  driveItems: ReadonlyArray<ResolvedOneDriveLibrarySyncLocation | undefined>
  onLocationsChange: (locations: OneDriveLinkData[]) => void
}) {
  const [selectedTreeItemIds, setSelectedTreeItemIds] = useState<string[]>([])
  const { treeItemIds, treeViewItems } = useMemo(
    () =>
      buildOneDriveTreeState({
        locations,
        driveItems,
      }),
    [driveItems, locations],
  )
  const handleRemoveSelectedLocations = useCallback(() => {
    setSelectedTreeItemIds([])
    onLocationsChange(
      locations.filter(function isUnselectedLocation(_location, index) {
        return !selectedTreeItemIds.includes(treeItemIds[index] ?? "")
      }),
    )
  }, [locations, onLocationsChange, selectedTreeItemIds, treeItemIds])

  return (
    <TreeActionsSection
      onRemoveSelectedLocations={handleRemoveSelectedLocations}
      selectedLocationsCount={selectedTreeItemIds.length}
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
