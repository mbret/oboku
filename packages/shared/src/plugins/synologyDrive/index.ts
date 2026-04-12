import { z } from "zod"
import type { BaseDataSourceDocType } from "../../db/docTypes"

export const PLUGIN_SYNOLOGY_DRIVE_TYPE = "synology-drive"

/** Synology Drive datasource config: connector reference plus selected file/folder ids. */
export type SynologyDriveDataSourceDocType = Omit<
  BaseDataSourceDocType,
  "data_v2"
> & {
  type: "synology-drive"
  data_v2?: { connectorId?: string; items?: ReadonlyArray<string> }
}

export type SynologyDriveConnectorDocType = {
  id: string
  type: "synology-drive"
  url: string
  username: string
  passwordAsSecretId: string
  allowSelfSigned?: boolean
}

export const synologyDriveApiCredentialsSchema = z.object({
  password: z.string().min(1),
  otpCode: z.string().min(1).optional(),
})

export type SynologyDriveApiCredentials = z.infer<
  typeof synologyDriveApiCredentialsSchema
>

export type SynologyDriveLinkData = {
  connectorId?: string
  fileId: string
}
