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

export const generateDropboxResourceId = (data: { fileId: string }) =>
  `dropbox-${data.fileId}`

export const explodeDropboxResourceId = (resourceId: string) => ({
  fileId: resourceId.replace(`dropbox-`, ``),
})
