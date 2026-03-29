import type { DropboxDataSourceDocType } from "../../db/docTypes"

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
