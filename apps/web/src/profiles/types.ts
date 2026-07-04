export type Profile = {
  id: string
  accessToken: string
  refreshToken: string
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
