/**
 * @see https://github.com/googleapis/google-auth-library-nodejs
 * @see https://github.com/googleapis/google-api-nodejs-client#authentication-and-authorization
 */
import { drive_v3 } from 'googleapis';
export declare type File = NonNullable<drive_v3.Schema$FileList['files']>[number];
export declare type DriveLinkData = {
    modifiedTime?: File['modifiedTime'];
};
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
export declare const authorize: (ctx: {
    credentials?: any;
}) => Promise<import("google-auth-library").OAuth2Client>;
