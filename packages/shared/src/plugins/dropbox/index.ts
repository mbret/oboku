import { z } from "zod"
import type { BaseDataSourceDocType } from "../../db/docTypes"

export type DropboxDataSourceDocType = Omit<
  BaseDataSourceDocType,
  "data_v2"
> & {
  type: "dropbox"
  data_v2?: {
    folderId?: string
    folderName?: string
  }
}

export const dropboxApiCredentialsSchema = z.object({
  accessToken: z.string().min(1),
  accessTokenExpiresAt: z.string().min(1),
  clientId: z.string().min(1),
  codeVerifier: z.string().min(1),
  refreshToken: z.string().min(1),
})

export type DropboxApiCredentials = z.infer<typeof dropboxApiCredentialsSchema>

export type DropboxDataSourceData = NonNullable<
  DropboxDataSourceDocType["data_v2"]
>

export type DropboxLinkData = {
  fileId: string
}
