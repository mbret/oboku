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
  microsoftApplicationClientId?: string
  microsoftApplicationAuthority?: string
}

export type UpdateInstanceSettingsRequest = Partial<
  Pick<
    GetInstanceSettingsResponse,
    | "showDisabledPlugins"
    | "microsoftApplicationClientId"
    | "microsoftApplicationAuthority"
  >
>

export type UpdateInstanceSettingsResponse = Record<string, unknown>
