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

export type OneDriveApiCredentials = {
  accessToken: string
  expiresAt?: number | null
}

export type OneDriveLinkData = {
  driveId: string
  fileId: string
}
