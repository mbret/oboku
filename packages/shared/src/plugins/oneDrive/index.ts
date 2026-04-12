import { z } from "zod"
import type { BaseDataSourceDocType } from "../../db/docTypes"

export const PLUGIN_ONE_DRIVE_TYPE = "one-drive"

export type OneDriveDataSourceDocType = Omit<
  BaseDataSourceDocType,
  "data_v2"
> & {
  type: "one-drive"
  data_v2?: {
    items?: ReadonlyArray<string>
  }
}

export const oneDriveApiCredentialsSchema = z.object({
  accessToken: z.string().min(1),
  expiresAt: z.number().nullable().optional(),
})

export type OneDriveApiCredentials = z.infer<
  typeof oneDriveApiCredentialsSchema
>

export type OneDriveLinkData = {
  driveId: string
  fileId: string
}
