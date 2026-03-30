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

export type DropboxApiCredentials = {
  accessToken: string
  accessTokenExpiresAt: string
  clientId: string
  codeVerifier: string
  refreshToken: string
}

export type DropboxDataSourceData = NonNullable<
  DropboxDataSourceDocType["data_v2"]
>

export type DropboxLinkData = {
  fileId: string
}
