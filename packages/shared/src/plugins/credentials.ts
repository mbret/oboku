import type { SourceType } from "../db/docTypes"
import { z } from "zod"
import { dropboxApiCredentialsSchema } from "./dropbox"
import { driveApiCredentialsSchema } from "./google"
import { oneDriveApiCredentialsSchema } from "./oneDrive"
import { opdsApiCredentialsSchema } from "./opds"
import { serverApiCredentialsSchema } from "./server"
import { synologyDriveApiCredentialsSchema } from "./synologyDrive"
import { webdavApiCredentialsSchema } from "./webdav"

/**
 * Providers like local file and URI do not require runtime API credentials.
 * We still model them as an explicit empty object so request payloads can
 * satisfy DTO validation consistently across the stack.
 */
export const noSourceApiCredentialsSchema = z.object({})

export type NoSourceApiCredentials = z.infer<
  typeof noSourceApiCredentialsSchema
>

export const sourceApiCredentialsSchemas = {
  webdav: webdavApiCredentialsSchema,
  "synology-drive": synologyDriveApiCredentialsSchema,
  DRIVE: driveApiCredentialsSchema,
  "one-drive": oneDriveApiCredentialsSchema,
  dropbox: dropboxApiCredentialsSchema,
  server: serverApiCredentialsSchema,
  opds: opdsApiCredentialsSchema,
  file: noSourceApiCredentialsSchema,
  URI: noSourceApiCredentialsSchema,
} satisfies {
  [K in SourceType]: z.ZodTypeAny
}

type SourceApiCredentialsSchemaMap = typeof sourceApiCredentialsSchemas

/**
 * Dynamic credentials passed when calling a provider's API (sync, getFileMetadata,
 * getFolderMetadata, download). Resolved at runtime (e.g. from secrets, request body).
 * Not stored in RxDB — only link/data_v2 (link credentials) are persisted.
 */
export type SourceApiCredentials<T extends SourceType> = z.infer<
  SourceApiCredentialsSchemaMap[T]
>

const formatSourceCredentialsIssue = (issue: z.ZodIssue) => {
  const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : ""

  return `${path}${issue.message}`
}

const sourceApiCredentialsParsers: {
  [K in SourceType]: (providerCredentials: unknown) => SourceApiCredentials<K>
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
  opds: (providerCredentials) =>
    opdsApiCredentialsSchema.parse(providerCredentials),
  file: (providerCredentials) =>
    noSourceApiCredentialsSchema.parse(providerCredentials),
  URI: (providerCredentials) =>
    noSourceApiCredentialsSchema.parse(providerCredentials),
}

export function parseSourceApiCredentials<T extends SourceType>(
  type: T,
  providerCredentials: unknown,
): SourceApiCredentials<T> {
  const schema = sourceApiCredentialsSchemas[type]
  const normalizedSourceCredentials = providerCredentials ?? {}
  const result = schema.safeParse(normalizedSourceCredentials)

  if (!result.success) {
    throw new Error(
      `Invalid ${type} provider credentials: ${result.error.issues
        .map(formatSourceCredentialsIssue)
        .join(", ")}`,
    )
  }

  return sourceApiCredentialsParsers[type](normalizedSourceCredentials)
}
