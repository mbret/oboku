import type { BaseDataSourceDocType } from "../../db/docTypes"

export type GoogleDriveDataSourceDocType = Omit<
  BaseDataSourceDocType,
  "data_v2"
> & {
  type: "DRIVE"
  data_v2?: {
    items?: ReadonlyArray<string>
  }
}

export type GoogleDriveLinkData = {
  fileId: string
}
