import { getOneDriveItemKey, type OneDriveLinkData } from "@oboku/shared"
import type { UseQueryOptions } from "@tanstack/react-query"
import { useCallback } from "react"
import { requestMicrosoftAccessToken } from "../auth/auth"
import { ONE_DRIVE_GRAPH_SCOPES } from "../constants"
import { getOneDriveItemSummary, type OneDriveDriveItemSummary } from "../graph"

export const oneDriveLibrarySyncLocationQueryKey = [
  "one-drive",
  "library-sync-location",
] as const

export const getOneDriveLibrarySyncLocationQueryKey = ({
  driveId,
  fileId,
}: {
  driveId: string
  fileId: string
}) => [...oneDriveLibrarySyncLocationQueryKey, driveId, fileId] as const

export type ResolvedOneDriveLibrarySyncLocation = {
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

export async function resolveOneDriveLibrarySyncLocation(
  location: OneDriveLinkData,
): Promise<ResolvedOneDriveLibrarySyncLocation> {
  const authResult = await requestMicrosoftAccessToken({
    interaction: "silent-only",
    scopes: ONE_DRIVE_GRAPH_SCOPES,
  })

  const metadata = await getOneDriveItemSummary({
    accessToken: authResult.accessToken,
    driveId: location.driveId,
    fileId: location.fileId,
  })
  const treeItemId = getCanonicalTreeItemId({
    fallbackDriveId: location.driveId,
    fallbackFileId: location.fileId,
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

export const useCreateLibrarySyncLocationQuery = () => {
  return useCallback(
    (
      location: OneDriveLinkData,
    ): UseQueryOptions<
      ResolvedOneDriveLibrarySyncLocation,
      unknown,
      ResolvedOneDriveLibrarySyncLocation
    > => ({
      queryKey: getOneDriveLibrarySyncLocationQueryKey({
        driveId: location.driveId,
        fileId: location.fileId,
      }),
      queryFn: () => resolveOneDriveLibrarySyncLocation(location),
      retry: false,
    }),
    [],
  )
}
