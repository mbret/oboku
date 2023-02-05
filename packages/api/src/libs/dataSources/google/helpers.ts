/**
 * @see https://github.com/googleapis/google-auth-library-nodejs
 * @see https://github.com/googleapis/google-api-nodejs-client#authentication-and-authorization
 */
import { drive_v3, google } from "googleapis"
import { getSecrets } from "./configure"

export type File = NonNullable<drive_v3.Schema$FileList["files"]>[number]
export type DriveLinkData = { modifiedTime?: File["modifiedTime"] }

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
export const authorize = async (ctx: { credentials?: any }) => {
  const { client_id, client_secret } = getSecrets()
  const oauth2Client = new google.auth.OAuth2({
    clientId: client_id,
    clientSecret: client_secret
  })

  oauth2Client.setCredentials(ctx.credentials || {})

  return oauth2Client
}
