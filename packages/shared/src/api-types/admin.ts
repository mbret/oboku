export type ServerSyncCredentialsResponse = {
  configured: boolean
  username: string | null
}

export type GetServerSyncResponse = {
  enabled: boolean
  credentials: ServerSyncCredentialsResponse
}

export type UpdateServerSyncResponse = {
  enabled: boolean
}

export type SetWebDavCredentialsResponse = {
  configured: boolean
  username: string
}

export type GetInstanceSettingsResponse = {
  showDisabledPlugins: boolean
}

export type UpdateInstanceSettingsRequest = Partial<
  Pick<GetInstanceSettingsResponse, "showDisabledPlugins">
>

export type UpdateInstanceSettingsResponse = {
  showDisabledPlugins: boolean
}
