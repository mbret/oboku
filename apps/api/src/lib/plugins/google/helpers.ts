/**
 * @see https://github.com/googleapis/google-auth-library-nodejs
 * @see https://github.com/googleapis/google-api-nodejs-client#authentication-and-authorization
 */
import type { DriveApiCredentials } from "@oboku/shared"
import { type drive_v3, google } from "googleapis"

export type File = NonNullable<drive_v3.Schema$FileList["files"]>[number]
export type DriveLinkData = { modifiedTime?: File["modifiedTime"] }

/**
 * Create an OAuth2 client with the given credentials.
 * @param ctx.credentials Typed API credentials for Google Drive (compatible with setCredentials).
 */
export const authorize = async (ctx: { credentials?: DriveApiCredentials }) => {
  const oauth2Client = new google.auth.OAuth2()

  oauth2Client.setCredentials(ctx.credentials || {})

  return oauth2Client
}
