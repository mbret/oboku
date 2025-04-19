import { z } from "zod"
import type { DropboxDataSourceDocType } from "../../db/docTypes"

export const dropboxSyncDataSchema = z.object({
  accessToken: z.string(),
  accessTokenExpiresAt: z.string(), // ISO date
  clientId: z.string(),
  codeVerifier: z.string().optional(),
  refreshToken: z.string().optional(),
})

export type DropboxSyncData = z.infer<typeof dropboxSyncDataSchema>
export type DropboxDataSourceData = NonNullable<
  DropboxDataSourceDocType["data_v2"]
>

export const getDropboxSyncData = (data: Record<string, unknown>) => {
  return dropboxSyncDataSchema.parse(data)
}
