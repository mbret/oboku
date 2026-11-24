import { getOneDriveItemKey, type OneDriveLinkData } from "@oboku/shared"
import type { UseQueryOptions } from "@tanstack/react-query"
import { useCallback } from "react"
import { requestMicrosoftAccessToken } from "../auth/auth"
import { ONE_DRIVE_GRAPH_SCOPES } from "../constants"
import { getOneDriveItemSummary, type OneDriveDriveItemSummary } from "../graph"

export const oneDriveLibrarySyncItemQueryKey = [
  "one-drive",
  "library-sync-item",
] as const

export const getOneDriveLibrarySyncItemQueryKey = ({
  driveId,
  fileId,
}: {
  driveId: string
  fileId: string
}) => [...oneDriveLibrarySyncItemQueryKey, driveId, fileId] as const

export type ResolvedOneDriveLibrarySyncItem = {
  treeItemId: string
  metadata: OneDriveDriveItemSummary
  parentTreeItemId?: string
}

function getCanonicalTreeItemId({
  fallbackDriveId,
  fallbackFileId,
  metadata,
}: {
  fallbackDriveId: string
  fallbackFileId: string
  metadata: OneDriveDriveItemSummary
}) {
  return getOneDriveItemKey({
    driveId: metadata.parentReference?.driveId ?? fallbackDriveId,
    fileId: metadata.id ?? fallbackFileId,
  })
}

export async function resolveOneDriveLibrarySyncItem(
  item: OneDriveLinkData,
): Promise<ResolvedOneDriveLibrarySyncItem> {
  const authResult = await requestMicrosoftAccessToken({
    interaction: "silent-only",
    scopes: ONE_DRIVE_GRAPH_SCOPES,
  })

  const metadata = await getOneDriveItemSummary({
    accessToken: authResult.accessToken,
    driveId: item.driveId,
    fileId: item.fileId,
  })
  const treeItemId = getCanonicalTreeItemId({
    fallbackDriveId: item.driveId,
    fallbackFileId: item.fileId,
    metadata,
  })
  const parentTreeItemId =
    metadata.parentReference?.driveId &&
    metadata.parentReference?.id &&
    metadata.parentReference.id !== "root"
      ? getOneDriveItemKey({
          driveId: metadata.parentReference.driveId,
          fileId: metadata.parentReference.id,
        })
      : undefined

  return {
    treeItemId,
    metadata,
    parentTreeItemId,
  }
}

export const useCreateLibrarySyncItemQuery = () => {
  return useCallback(
    (
      item: OneDriveLinkData,
    ): UseQueryOptions<
      ResolvedOneDriveLibrarySyncItem,
      unknown,
      ResolvedOneDriveLibrarySyncItem
    > => ({
      queryKey: getOneDriveLibrarySyncItemQueryKey({
        driveId: item.driveId,
        fileId: item.fileId,
      }),
      queryFn: () => resolveOneDriveLibrarySyncItem(item),
      retry: false,
    }),
    [],
  )
}
