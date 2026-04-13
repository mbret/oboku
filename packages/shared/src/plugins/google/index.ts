import { z } from "zod"
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

/**
 * Google OAuth payload accepted by the API. We keep the fields compatible with
 * OAuth2 setCredentials() and also accept the token timing fields forwarded by
 * the web app.
 */
export const driveApiCredentialsSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1).nullable().optional(),
  expiry_date: z.number().nullable().optional(),
  token_type: z.string().min(1).nullable().optional(),
  id_token: z.string().min(1).nullable().optional(),
  scope: z.string().optional(),
  expires_in: z.union([z.string(), z.number()]).optional(),
  created_at: z.number().optional(),
})

export type DriveApiCredentials = z.infer<typeof driveApiCredentialsSchema>

export type GoogleDriveLinkData = {
  fileId: string
}
