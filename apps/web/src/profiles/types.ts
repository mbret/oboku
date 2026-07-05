export type Profile = {
  id: string
  email: string
  nameHex: string
  dbName: string
  /**
   * Soft health flag: the refresh chain is dead and the user must
   * re-authenticate, but the profile and its data stay usable offline.
   */
  needsRelogin?: boolean
  /**
   * Lifecycle intent (absent means active). A `loggedOut` profile is a
   * tombstone kept only until its server-side session is revoked, at which
   * point it is deleted (see `useRevokeLoggedOutProfiles`).
   */
  status?: "active" | "loggedOut"
}

/**
 * Rows written before auth moved to httpOnly cookies persisted the tokens.
 * They survive only until the one-time cookie migration (active rows) or the
 * legacy tombstone sweep (logged-out rows) strips them.
 */
export type ProfileWithLegacyTokens = Profile & {
  accessToken?: string
  refreshToken?: string
}
