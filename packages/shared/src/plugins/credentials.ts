import type { DataSourceType } from "../db/docTypes"
import type { WebdavApiCredentials } from "./webdav"
import type { DropboxApiCredentials } from "./dropbox"
import type { SynologyDriveApiCredentials } from "@oboku/synology"

/**
 * Google OAuth2 credentials shape passed to the API when calling Google Drive.
 * Compatible with google-auth-library's setCredentials() (no lib dependency here).
 */
export type DriveApiCredentials = {
  access_token?: string | null
  refresh_token?: string | null
  expiry_date?: number | null
  token_type?: string | null
  id_token?: string | null
  scope?: string
}

/**
 * Providers like local file and URI do not require runtime API credentials.
 * We still model them as an explicit empty object so request payloads can
 * satisfy DTO validation consistently across the stack.
 */
export type NoProviderApiCredentials = Record<never, never>

/**
 * Dynamic credentials passed when calling a provider's API (sync, getFileMetadata,
 * getFolderMetadata, download). Resolved at runtime (e.g. from secrets, request body).
 * Not stored in RxDB — only link/data_v2 (link credentials) are persisted.
 */
export type ProviderApiCredentials<T extends DataSourceType> =
  T extends "webdav"
    ? WebdavApiCredentials
    : T extends "synology-drive"
      ? SynologyDriveApiCredentials
      : T extends "DRIVE"
        ? DriveApiCredentials
        : T extends "dropbox"
          ? DropboxApiCredentials
          : T extends "file" | "URI"
            ? NoProviderApiCredentials
            : never
