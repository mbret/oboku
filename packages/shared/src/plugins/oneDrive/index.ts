import { z } from "zod"
import type { BaseDataSourceDocType } from "../../db/docTypes"

export const PLUGIN_ONE_DRIVE_TYPE = "one-drive"

export type OneDriveLinkData = {
  driveId: string
  fileId: string
}

export function getOneDriveItemKey({
  driveId,
  fileId,
}: {
  driveId: string
  fileId: string
}) {
  return `${encodeURIComponent(driveId)}:${encodeURIComponent(fileId)}`
}

export type OneDriveDataSourceDocType = Omit<
  BaseDataSourceDocType,
  "data_v2"
> & {
  type: "one-drive"
  data_v2?: {
    items?: ReadonlyArray<OneDriveLinkData>
  }
}

export const oneDriveApiCredentialsSchema = z.object({
  accessToken: z.string().min(1),
  expiresAt: z.number().nullable().optional(),
})

export type OneDriveApiCredentials = z.infer<
  typeof oneDriveApiCredentialsSchema
>
