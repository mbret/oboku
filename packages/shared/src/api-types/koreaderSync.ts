export type GetKoreaderSyncResponse = {
  /** What devices sign in with as username: the account email. */
  username: string
  /** When the current password was generated, `null` while sync is off. */
  passwordCreatedAt: string | null
}

export type CreateKoreaderSyncPasswordResponse = {
  username: string
  /** Shown once: only a hash of it is kept. */
  password: string
}
