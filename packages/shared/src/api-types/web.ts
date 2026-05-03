import { z } from "zod"

/**
 * Schema for the response of `GET /web/config`.
 *
 * Defined as a zod schema so the web app can validate values restored from
 * localStorage at runtime (the cache is user-controllable storage and must be
 * treated as untrusted input). The type is derived from the schema so the API
 * and the web app stay in sync.
 */
export const getWebConfigResponseSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  DROPBOX_CLIENT_ID: z.string().optional(),
  MICROSOFT_APPLICATION_CLIENT_ID: z.string().optional(),
  MICROSOFT_APPLICATION_AUTHORITY: z.string(),
  FEATURE_SERVER_SYNC_ENABLED: z.boolean(),
  SHOW_DISABLED_PLUGINS: z.boolean(),
})

export type GetWebConfigResponse = z.infer<typeof getWebConfigResponseSchema>
