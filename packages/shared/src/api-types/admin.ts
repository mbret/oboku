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

export type AdminUserSummary = {
  id: number
  email: string
  username: string
  emailVerified: boolean
  hasPassword: boolean
  createdAt: string
}

export type GetAdminUsersResponse = AdminUserSummary[]

export type GetTokenStatsResponse = {
  totalTokens: number
  activeTokens: number
  distinctUsers: number
  distinctSessions: number
}

export type RevokeTokensRequest = {
  audienceType: "all" | "emails"
  emails?: string[]
}

export type RevokeTokensResponse = {
  revokedTokens: number
  /** Number of matched users when targeting emails; null for a full revoke. */
  targetedUsers: number | null
}
