export class WebConfigResponseDto {
  GOOGLE_CLIENT_ID?: string
  GOOGLE_API_KEY?: string
  DROPBOX_CLIENT_ID?: string
  MICROSOFT_APPLICATION_CLIENT_ID?: string
  MICROSOFT_APPLICATION_AUTHORITY!: string
  FEATURE_SERVER_SYNC_ENABLED!: boolean
  SHOW_DISABLED_PLUGINS!: boolean
}

export class PublicServerSourceDto {
  id!: string
  name!: string
}
