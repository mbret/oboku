import type { DataSourceType } from "../db/docTypes"
import { z } from "zod"
import { dropboxApiCredentialsSchema } from "./dropbox"
import { driveApiCredentialsSchema } from "./google"
import { oneDriveApiCredentialsSchema } from "./oneDrive"
import { serverApiCredentialsSchema } from "./server"
import { synologyDriveApiCredentialsSchema } from "./synologyDrive"
import { webdavApiCredentialsSchema } from "./webdav"

/**
 * Providers like local file and URI do not require runtime API credentials.
 * We still model them as an explicit empty object so request payloads can
 * satisfy DTO validation consistently across the stack.
 */
export const noProviderApiCredentialsSchema = z.object({})

export type NoProviderApiCredentials = z.infer<
  typeof noProviderApiCredentialsSchema
>

export const providerApiCredentialsSchemas = {
  webdav: webdavApiCredentialsSchema,
  "synology-drive": synologyDriveApiCredentialsSchema,
  DRIVE: driveApiCredentialsSchema,
  "one-drive": oneDriveApiCredentialsSchema,
  dropbox: dropboxApiCredentialsSchema,
  server: serverApiCredentialsSchema,
  file: noProviderApiCredentialsSchema,
  URI: noProviderApiCredentialsSchema,
} satisfies {
  [K in DataSourceType]: z.ZodTypeAny
}

type ProviderApiCredentialsSchemaMap = typeof providerApiCredentialsSchemas

/**
 * Dynamic credentials passed when calling a provider's API (sync, getFileMetadata,
 * getFolderMetadata, download). Resolved at runtime (e.g. from secrets, request body).
 * Not stored in RxDB — only link/data_v2 (link credentials) are persisted.
 */
export type ProviderApiCredentials<T extends DataSourceType> = z.infer<
  ProviderApiCredentialsSchemaMap[T]
>

const formatProviderCredentialsIssue = (issue: z.ZodIssue) => {
  const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : ""

  return `${path}${issue.message}`
}

const providerApiCredentialsParsers: {
  [K in DataSourceType]: (
    providerCredentials: unknown,
  ) => ProviderApiCredentials<K>
} = {
  webdav: (providerCredentials) =>
    webdavApiCredentialsSchema.parse(providerCredentials),
  "synology-drive": (providerCredentials) =>
    synologyDriveApiCredentialsSchema.parse(providerCredentials),
  DRIVE: (providerCredentials) =>
    driveApiCredentialsSchema.parse(providerCredentials),
  "one-drive": (providerCredentials) =>
    oneDriveApiCredentialsSchema.parse(providerCredentials),
  dropbox: (providerCredentials) =>
    dropboxApiCredentialsSchema.parse(providerCredentials),
  server: (providerCredentials) =>
    serverApiCredentialsSchema.parse(providerCredentials),
  file: (providerCredentials) =>
    noProviderApiCredentialsSchema.parse(providerCredentials),
  URI: (providerCredentials) =>
    noProviderApiCredentialsSchema.parse(providerCredentials),
}

export function parseProviderApiCredentials<T extends DataSourceType>(
  type: T,
  providerCredentials: unknown,
): ProviderApiCredentials<T> {
  const schema = providerApiCredentialsSchemas[type]
  const normalizedProviderCredentials = providerCredentials ?? {}
  const result = schema.safeParse(normalizedProviderCredentials)

  if (!result.success) {
    throw new Error(
      `Invalid ${type} provider credentials: ${result.error.issues
        .map(formatProviderCredentialsIssue)
        .join(", ")}`,
    )
  }

  return providerApiCredentialsParsers[type](normalizedProviderCredentials)
}
