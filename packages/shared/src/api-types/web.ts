export type GetWebConfigResponse = {
  GOOGLE_CLIENT_ID: string | undefined
  GOOGLE_API_KEY: string | undefined
  DROPBOX_CLIENT_ID: string | undefined
  MICROSOFT_APPLICATION_CLIENT_ID: string | undefined
  MICROSOFT_APPLICATION_AUTHORITY: string
  FEATURE_SERVER_SYNC_ENABLED: boolean
  SHOW_DISABLED_PLUGINS: boolean
}
