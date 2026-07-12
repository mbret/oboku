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
  /**
   * Non-secret identity of this profile's server session, minted at sign-in.
   * The logout sweep presents it to revoke exactly this session. Rows persisted
   * before session-scoped logout are backfilled with a throwaway UUID at boot
   * (see `LegacyAuthMigration`), so this is always present; a backfilled id
   * matches no server session and simply no-ops at logout.
   */
  sessionId: string
}
